import { isFriendlyUI } from "@/themes/forumTheme";

/**
 * Don't send a PM to users if their comments are deleted with this reason.  Used for account deletion requests.
 */
export const noDeletionPmReason = 'Requested account deletion';

export const COMMENTS_NEW_FORM_PADDING = isFriendlyUI ? 12 : 10;
