import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";
import CommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeCommentOutlined';
import { useVote } from "../votes/withVote";
import { VotingProps } from "../votes/votingProps";
import { getNormalizedReactionsListFromVoteProps } from "@/lib/voting/namesAttachedReactions";
import { getVotingSystemByName } from "@/lib/voting/getVotingSystem";
import { FeedCommentMetaInfo, FeedPostMetaInfo } from "./ultraFeedTypes";
import { useCurrentUser } from "../common/withUser";
import { useCreate } from "../../lib/crud/withCreate";
import { useDialog } from "../common/withDialog";

const styles = defineStyles("UltraFeedItemFooter", (theme: ThemeType) => ({
  root: {
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    opacity: `1 !important`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: theme.typography.body2.fontSize,
    // every child except last has margin right applied
    "& > *:not(:last-child)": {
      marginRight: 16,
    },
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: `${theme.palette.linkHover.dim} !important`,
    },
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 8,
      paddingRight: 8,
      justifyContent: "space-between",
      ...theme.typography.ultraFeedMobileStyle,
      "& > *:not(:last-child)": {
        marginRight: 'unset',
      },
    },
  },
  commentCount: {
    color: `${theme.palette.ultraFeed.dim} !important`,
    display: "flex",
    alignItems: "center",
    "& svg": {
      position: "relative",
      height: 18,
      top: 1,
      [theme.breakpoints.down('sm')]: {
        height: 20,
        width: 20,
        top: 2,
      },
    },
  },
  commentCountClickable: {
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.grey[1000],
    },
  },
  commentCountText: {
    marginLeft: 4,
    [theme.breakpoints.down('sm')]: {
      position: 'relative',
    }
  },
  addReactionButton: {
    opacity: 0.7,
    position: "relative",
    top: 1,
    color: `${theme.palette.ultraFeed.dim} !important`,
    display: 'flex',
    marginRight: 6,
    marginLeft: 'auto',
    alignItems: 'center',
    '& .react-hover-style': {
      filter: 'opacity(1) !important',
    },
    '& svg': {
      filter: 'opacity(1) !important',
      [theme.breakpoints.down('sm')]: {
        top: 5,
        height: 21,
        width: 21,
      },
    },
    [theme.breakpoints.down('sm')]: {
      opacity: 1,
      marginLeft: 6,
      top: 0,
    }
  },
  reactionIcon: {
    marginRight: 6,
  },
  reactionCount: {
    position: "relative",
    bottom: 2,
  },
  bookmarkButton: {
    position: "relative", 
    top: 3,
    opacity: 0.7,
    "& svg": {
      color: `${theme.palette.ultraFeed.dim} !important`,
      height: 20,
      [theme.breakpoints.down('sm')]: {
        height: 22,
      },
    },
    [theme.breakpoints.down('sm')]: {
      top: 5,
      opacity: 1,
    },
  },
  overallVoteButtons: {
    color: `${theme.palette.ultraFeed.dim} !important`,
    "& .VoteArrowIconSolid-root": {
    }
  },
  agreementButtons: {
    color: `${theme.palette.ultraFeed.dim} !important`,
    marginLeft: -8
  },
  footerVoteScoreOverride: {
    fontSize: `${theme.typography.body2.fontSize}px !important`, 
    margin: '0 7px !important',
    [theme.breakpoints.down('sm')]: {
      fontSize: '17px !important',
      margin: '0 7px !important',
    }
  },
  hideSecondaryScoreOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: 'none !important',
    }
  },
  footerAgreementScoreOverride: {
    fontSize: `${theme.typography.body2.fontSize}px !important`,
    margin: '0 7px !important',
    [theme.breakpoints.down('sm')]: {
      fontSize: '17px !important',
      margin: '0 7px !important',
    }
  },
}));

interface UltraFeedItemFooterCoreProps {
  commentCount: number;
  onClickComments: () => void;
  showVoteButtons: boolean;
  voteProps: VotingProps<VoteableTypeClient>;
  hideKarma?: boolean;
  reactionCount: number;
  bookmarkDocument?: PostsMinimumInfo;
  className?: string;
}

const UltraFeedItemFooterCore = ({
  commentCount,
  onClickComments,
  showVoteButtons,
  voteProps,
  hideKarma,
  reactionCount,
  bookmarkDocument,
  className,
}: UltraFeedItemFooterCoreProps) => {
  const classes = useStyles(styles);
  const { BookmarkButton, OverallVoteAxis, AgreementVoteAxis, AddReactionButton } = Components;
  const currentUser = useCurrentUser();

  const { create: createUltraFeedEvent } = useCreate({
    collectionName: "UltraFeedEvents",
    fragmentName: 'UltraFeedEventsDefaultFragment',
  });

  // TODO:the wrapping approach does not work with votes as click-handlers inside the vote bottons prevent an onClick at this level from firing
  const handleInteractionLog = (interactionType: 'bookmarkClicked' | 'commentsClicked') => {
    if (!currentUser || !voteProps.document) return;

    const eventData = {
      data: {
        userId: currentUser._id,
        eventType: 'interacted' as const,
        documentId: voteProps.document._id,
        collectionName: voteProps.collectionName as "Posts" | "Comments" | "Spotlights", 
        event: { interactionType },
      }
    };
    void createUltraFeedEvent(eventData);
  };

  const handleCommentsClick = () => {
    if (onClickComments) {
      handleInteractionLog('commentsClicked');
      onClickComments();
    }
  };

  const commentCountIcon = (
    <div
      onClick={handleCommentsClick}
      className={classNames(classes.commentCount, { [classes.commentCountClickable]: !!onClickComments })}
    >
      <CommentIcon />
      <span className={classes.commentCountText}>
        {commentCount}
      </span>
    </div>
  );

  return (
    <div className={classNames(classes.root, className)}>
      {commentCountIcon}

      {showVoteButtons && voteProps.document && (
        <>
          <div className={classes.overallVoteButtons}>
            <OverallVoteAxis
              document={voteProps.document}
              hideKarma={hideKarma}
              voteProps={voteProps}
              verticalArrows
              largeArrows
              voteScoreClassName={classes.footerVoteScoreOverride}
              secondaryScoreClassName={classes.hideSecondaryScoreOnMobile}
              hideAfScore={true}
            />
          </div>
          <div className={classes.agreementButtons}>
            <AgreementVoteAxis
              document={voteProps.document}
              hideKarma={hideKarma}
              voteProps={voteProps}
              agreementScoreClassName={classes.footerAgreementScoreOverride}
            />
          </div>
        </>
      )}

      {voteProps.document && (
        <div className={classes.addReactionButton}>
          <div className={classes.reactionIcon}>
            <AddReactionButton voteProps={voteProps} />
          </div>
          <div className={classes.reactionCount}>
            {reactionCount > 0 && reactionCount}
          </div>
        </div>
      )}
      
      { bookmarkDocument && (
        <div className={classes.bookmarkButton} onClick={() => handleInteractionLog('bookmarkClicked')}>
          <BookmarkButton post={bookmarkDocument} />
        </div>
      )}
    </div>
  );
};


const UltraFeedPostFooter = ({ post, metaInfo, className }: { post: PostsListWithVotes, metaInfo: FeedPostMetaInfo, className?: string }) => {
  const { openDialog } = useDialog();

  const votingSystem = getVotingSystemByName(post?.votingSystem || "default");
  const voteProps = useVote(post, "Posts", votingSystem);
  const reacts = getNormalizedReactionsListFromVoteProps(voteProps)?.reacts;
  const reactionCount = reacts ? Object.keys(reacts).length : 0;
  const showVoteButtons = votingSystem.name === "namesAttachedReactions";
  const commentCount = post.commentCount ?? 0;
  
  const onClickComments = () => {
    openDialog({
      name: "commentsDialog",
      closeOnNavigate: true,
      contents: ({onClose}) => <Components.UltraFeedCommentsDialog 
        document={post}
        collectionName="Posts"
        onClose={onClose}
      />
    });
  }

  return (
    <UltraFeedItemFooterCore
      commentCount={commentCount}
      onClickComments={onClickComments}
      showVoteButtons={showVoteButtons}
      voteProps={voteProps}
      hideKarma={false}
      reactionCount={reactionCount}
      bookmarkDocument={post}
      className={className}
    />
  );
}


const UltraFeedCommentFooter = ({ comment, metaInfo, className }: { comment: UltraFeedComment, metaInfo: FeedCommentMetaInfo, className?: string }) => {
  const { openDialog } = useDialog();

  const parentPost = comment.post;
  const votingSystem = getVotingSystemByName(parentPost?.votingSystem || "default");
  const voteProps = useVote(comment, "Comments", votingSystem);
  const reacts = getNormalizedReactionsListFromVoteProps(voteProps)?.reacts;
  const reactionCount = reacts ? Object.keys(reacts).length : 0;
  const hideKarma = !!parentPost?.hideCommentKarma;
  const showVoteButtons = votingSystem.name === "namesAttachedReactions" && !hideKarma;
  const commentCount = metaInfo.directDescendentCount;
  
  const onClickComments = () => {
    openDialog({
      name: "UltraFeedCommentsDialog",
      closeOnNavigate: true,
      contents: ({onClose}) => <Components.UltraFeedCommentsDialog 
        document={comment}
        collectionName="Comments"
        onClose={onClose}
      />
    });
  }

  const bookmarkDocument = parentPost;

  return (
    <UltraFeedItemFooterCore
      commentCount={commentCount}
      onClickComments={onClickComments}
      showVoteButtons={showVoteButtons}
      voteProps={voteProps}
      hideKarma={hideKarma}
      reactionCount={reactionCount}
      bookmarkDocument={bookmarkDocument ?? undefined}
      className={className}
    />
  );
}


interface UltraFeedPostFooterProps {
  document: PostsListWithVotes;
  collectionName: "Posts";
  metaInfo: FeedPostMetaInfo;
  className?: string;
}

interface UltraFeedCommentFooterProps {
  document: UltraFeedComment;
  collectionName: "Comments";
  metaInfo: FeedCommentMetaInfo;
  className?: string;
}

type UltraFeedItemFooterProps = UltraFeedPostFooterProps | UltraFeedCommentFooterProps;

const UltraFeedItemFooter = ({ document, collectionName, metaInfo, className }: UltraFeedItemFooterProps) => {
  if (collectionName === "Posts") {
    return <UltraFeedPostFooter post={document} metaInfo={metaInfo} className={className} />;
  } else if (collectionName === "Comments") {
    return <UltraFeedCommentFooter comment={document} metaInfo={metaInfo} className={className} />;
  }
  return null;
};


const UltraFeedItemFooterComponent = registerComponent("UltraFeedItemFooter", UltraFeedItemFooter);

export default UltraFeedItemFooterComponent; 

declare global {
  interface ComponentTypes {
    UltraFeedItemFooter: typeof UltraFeedItemFooterComponent
  }
} 
