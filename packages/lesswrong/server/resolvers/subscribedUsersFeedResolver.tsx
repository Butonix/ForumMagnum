import { Posts } from "../../lib/collections/posts";
import { Subscriptions } from "../../lib/collections/subscriptions";
import { defineFeedResolver } from "../utils/feedUtil";
import { addGraphQLSchema } from "../vulcan-lib";
import { Comments } from "../../lib/collections/comments";
import keyBy from "lodash/keyBy";
import { PostsRepo } from "../repos";
import { loadByIds } from "../../lib/loaders";
import { filterNonnull } from "../../lib/utils/typeGuardUtils";
import { accessFilterMultiple } from "../../lib/utils/schemaUtils";

addGraphQLSchema(`
  type SubscribedPostAndComments {
    _id: String!
    post: Post!
    comments: [Comment!]!
    postIsFromSubscribedUser: Boolean!
  }
`);

defineFeedResolver<Date>({
  name: "SubscribedFeed",
  cutoffTypeGraphQL: "Date",
  args: "af: Boolean",
  resultTypesGraphQL: `
    postCommented: SubscribedPostAndComments
  `,
  resolver: async ({limit=20, cutoff, offset, args, context}: {
    limit?: number, cutoff?: Date, offset?: number,
    args: {af: boolean},
    context: ResolverContext
  }) => {
    const currentUser = context.currentUser;
    if (!currentUser) throw new Error("Must be logged in");

    const postsAndCommentsAll = await new PostsRepo().getPostsAndCommentsFromSubscriptions(currentUser._id, 90);
    const postsAndComments = postsAndCommentsAll.slice(offset, (offset??0)+limit);
    const isLastPage = postsAndComments.length < limit;
    
    const postIds: string[] = postsAndComments.map(row => row.postId);
    const commentIds: string[] = postsAndComments.flatMap(row => row.commentIds ?? []);
    
    const [posts, comments] = await Promise.all([
      (async () =>
        accessFilterMultiple(currentUser, Posts,    await loadByIds(context, "Posts",    postIds),    context)
      )(),
      (async () =>
        accessFilterMultiple(currentUser, Comments, await loadByIds(context, "Comments", commentIds), context)
      )()
    ]);
    const postsById = keyBy(filterNonnull(posts), p=>p._id);
    const commentsById = keyBy(filterNonnull(comments), c=>c._id);
    
    return {
      cutoff: isLastPage ? null : new Date(),
      endOffset: (offset??0)+postsAndComments.length,
      results: postsAndComments.map(postAndCommentsRow => {
        return {
          type: "postCommented",
          postCommented: {
            _id: postAndCommentsRow.postId,
            post: postsById[postAndCommentsRow.postId],
            postIsFromSubscribedUser: !!postAndCommentsRow.subscribedPosts,
            comments: postAndCommentsRow.commentIds?.map(commentId => commentsById[commentId]) ?? [],
          }
        };
      })
    };
  }
});

async function getSubscribedUserIds(currentUser: DbUser): Promise<DbSubscription[]> {
  const subscriptions = await Subscriptions.find({
    userId: currentUser._id,
    collectionName: "Users",
  }).fetch();
  return subscriptions;
}
