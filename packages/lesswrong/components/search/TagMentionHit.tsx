import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { isEAForum } from "@/lib/instanceSettings";

const styles = () => ({
  root: {
    ...(isEAForum && {
      display: "block",
      maxWidth: 500,
      overflow: "hidden",
      textOverflow: "ellipsis",
    }),
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 6,
    transform: "translateY(4px)",
  },
});

const TagMentionHit = ({hit, classes}: {
  hit: SearchTag,
  classes: ClassesType<typeof styles>,
}) => {
  const icon = isEAForum
    ? <Components.ForumIcon icon="Tag" className={classes.icon} />
    : "🏷️";
  return (
    <span className={classes.root}>
      {icon} <span>{hit.name}</span>
    </span>
  );
}

const TagMentionHitComponent = registerComponent(
  "TagMentionHit",
  TagMentionHit,
  {styles},
);

declare global {
  interface ComponentTypes {
    TagMentionHit: typeof TagMentionHitComponent
  }
}
