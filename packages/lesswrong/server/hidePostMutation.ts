import Users from '../server/collections/users/collection';
import { accessFilterSingle } from '../lib/utils/schemaUtils';
import some from 'lodash/some'
import reject from 'lodash/reject'
import gql from 'graphql-tag';
import { updateUser } from './collections/users/mutations';

export const hidePostGqlTypeDefs = gql`
  extend type Mutation {
    setIsHidden(postId: String!, isHidden: Boolean!): User!
  }
`

export const hidePostGqlMutations = {
  async setIsHidden(root: void, {postId,isHidden: isHidden}: {postId: string, isHidden: boolean}, context: ResolverContext): Promise<Partial<DbUser>> {
    const {currentUser} = context;
    if (!currentUser)
      throw new Error("Log in to hide posts");
    
    // FIXME: this has a race condition with multiple hiding at the same time where last write wins.
    // This would be better if we either change from a list data model to separate objects, or move
    // to leveraging inserts and removals in Mongo vs. writing the whole list
    const oldHiddenList = currentUser.hiddenPostsMetadata || [];

    let newHiddenList: Array<{postId: string}>;
    if (isHidden) {
      const alreadyHidden = some(oldHiddenList, hiddenMetadata => hiddenMetadata.postId === postId)
      if (alreadyHidden) {
        newHiddenList = oldHiddenList;
      } else {
        newHiddenList = [...oldHiddenList, {postId: postId}]
      }
    } else {
        newHiddenList = reject(oldHiddenList, hiddenMetadata=>hiddenMetadata.postId===postId)
    }
    
    await updateUser({
      data: {hiddenPostsMetadata: newHiddenList},
      selector: { _id: currentUser._id }
    }, context);
    
    const updatedUser = await Users.findOne(currentUser._id)!;
    return (await accessFilterSingle(currentUser, 'Users', updatedUser, context))!;
  }
}
