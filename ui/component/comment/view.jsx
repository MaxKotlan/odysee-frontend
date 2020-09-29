// @flow
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import { FF_MAX_CHARS_IN_COMMENT } from 'constants/form-field';
import { SITE_NAME, SIMPLE_SITE } from 'config';
import React, { useEffect, useState } from 'react';
import { isEmpty } from 'util/object';
import DateTime from 'component/dateTime';
import Button from 'component/button';
import Expandable from 'component/expandable';
import MarkdownPreview from 'component/common/markdown-preview';
import ChannelThumbnail from 'component/channelThumbnail';
import { Menu, MenuList, MenuButton, MenuItem } from '@reach/menu-button';
import Icon from 'component/common/icon';
import { FormField, Form } from 'component/common/form';
import classnames from 'classnames';
import usePersistedState from 'effects/use-persisted-state';
import CommentReactions from 'component/commentReactions';
import CommentsReplies from 'component/commentsReplies';
import { useHistory } from 'react-router';

type Props = {
  uri: string,
  author: ?string, // LBRY Channel Name, e.g. @channel
  authorUri: string, // full LBRY Channel URI: lbry://@channel#123...
  commentId: string, // sha256 digest identifying the comment
  topLevelId: string, // sha256 digest identifying the parent of the comment
  message: string, // comment body
  timePosted: number, // Comment timestamp
  channel: ?Claim, // Channel Claim, retrieved to obtain thumbnail
  pending?: boolean,
  resolveUri: string => void, // resolves the URI
  isResolvingUri: boolean, // if the URI is currently being resolved
  channelIsBlocked: boolean, // if the channel is blacklisted in the app
  claimIsMine: boolean, // if you control the claim which this comment was posted on
  commentIsMine: boolean, // if this comment was signed by an owned channel
  updateComment: (string, string) => void,
  deleteComment: string => void,
  blockChannel: string => void,
  linkedComment?: any,
  myChannels: ?Array<ChannelClaim>,
  commentingEnabled: boolean,
  doToast: ({ message: string }) => void,
  hideReplyButton?: boolean,
  isTopLevel?: boolean,
  topLevelIsReplying: boolean,
  setTopLevelIsReplying: boolean => void,
};

const LENGTH_TO_COLLAPSE = 300;
const ESCAPE_KEY = 27;

function Comment(props: Props) {
  const {
    uri,
    author,
    authorUri,
    timePosted,
    message,
    pending,
    channel,
    isResolvingUri,
    resolveUri,
    channelIsBlocked,
    commentIsMine,
    commentId,
    updateComment,
    deleteComment,
    blockChannel,
    linkedComment,
    commentingEnabled,
    myChannels,
    doToast,
    hideReplyButton,
    isTopLevel,
    topLevelIsReplying,
    setTopLevelIsReplying,
    topLevelId,
  } = props;
  const {
    push,
    location: { pathname },
  } = useHistory();
  const [isReplying, setReplying] = React.useState(false);
  const [isEditing, setEditing] = useState(false);
  const [editedMessage, setCommentValue] = useState(message);
  const [charCount, setCharCount] = useState(editedMessage.length);
  // used for controlling the visibility of the menu icon
  const [mouseIsHovering, setMouseHover] = useState(false);
  const [advancedEditor] = usePersistedState('comment-editor-mode', false);
  const hasChannels = myChannels && myChannels.length > 0;

  // to debounce subsequent requests
  const shouldFetch =
    channel === undefined ||
    (channel !== null && channel.value_type === 'channel' && isEmpty(channel.meta) && !pending);

  useEffect(() => {
    // If author was extracted from the URI, then it must be valid.
    if (authorUri && author && !isResolvingUri && shouldFetch) {
      resolveUri(authorUri);
    }

    if (isEditing) {
      setCharCount(editedMessage.length);

      // a user will try and press the escape key to cancel editing their comment
      const handleEscape = event => {
        if (event.keyCode === ESCAPE_KEY) {
          setEditing(false);
        }
      };

      window.addEventListener('keydown', handleEscape);

      // removes the listener so it doesn't cause problems elsewhere in the app
      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isResolvingUri, shouldFetch, author, authorUri, resolveUri, editedMessage, isEditing, setEditing]);

  function handleEditMessageChanged(event) {
    setCommentValue(!SIMPLE_SITE && advancedEditor ? event : event.target.value);
  }

  function handleSubmit() {
    updateComment(commentId, editedMessage);
    setEditing(false);
  }

  function handleCommentReply() {
    if (!hasChannels) {
      push(`/$/${PAGES.CHANNEL_NEW}?redirect=${pathname}`);
      doToast({ message: __('A channel is required to comment on %SITE_NAME%', { SITE_NAME }) });
    } else {
      if (setTopLevelIsReplying) {
        setTopLevelIsReplying(!topLevelIsReplying);
      } else {
        setReplying(!isReplying);
      }
    }
  }

  return (
    <li
      className={classnames('comment', {
        'comment--reply': !isTopLevel,
        'comment--highlighted': linkedComment && linkedComment.comment_id === commentId,
      })}
      id={commentId}
      onMouseOver={() => setMouseHover(true)}
      onMouseOut={() => setMouseHover(false)}
    >
      <div className="comment__content">
        <div className="comment__author-thumbnail">
          {authorUri ? (
            <ChannelThumbnail uri={authorUri} obscure={channelIsBlocked} small />
          ) : (
            <ChannelThumbnail small />
          )}
        </div>

        <div className="comment__body_container">
          <div className="comment__meta">
            <div className="comment__meta-information">
              {!author ? (
                <span className="comment__author">{__('Anonymous')}</span>
              ) : (
                <Button
                  className="button--uri-indicator truncated-text comment__author"
                  navigate={authorUri}
                  label={author}
                />
              )}
              <Button
                className="button--uri-indicator"
                navigate={`${uri}?lc=${commentId}`}
                label={
                  <time className="comment__time" dateTime={timePosted}>
                    {DateTime.getTimeAgoStr(timePosted)}
                  </time>
                }
              />
            </div>
            <div className="comment__menu">
              <Menu>
                <MenuButton>
                  <Icon
                    size={18}
                    className={mouseIsHovering ? 'comment__menu-icon--hovering' : 'comment__menu-icon'}
                    icon={ICONS.MORE_VERTICAL}
                  />
                </MenuButton>
                <MenuList className="menu__list--comments">
                  {commentIsMine ? (
                    <>
                      <MenuItem className="comment__menu-option" onSelect={() => setEditing(true)}>
                        {__('Edit')}
                      </MenuItem>
                      <MenuItem className="comment__menu-option" onSelect={() => deleteComment(commentId)}>
                        {__('Delete')}
                      </MenuItem>
                    </>
                  ) : (
                    <MenuItem className="comment__menu-option" onSelect={() => blockChannel(authorUri)}>
                      {__('Block Channel')}
                    </MenuItem>
                  )}
                </MenuList>
              </Menu>
            </div>
          </div>
          <div>
            {isEditing ? (
              <Form onSubmit={handleSubmit}>
                <FormField
                  type={!SIMPLE_SITE && advancedEditor ? 'markdown' : 'textarea'}
                  name="editing_comment"
                  value={editedMessage}
                  charCount={charCount}
                  onChange={handleEditMessageChanged}
                  textAreaMaxLength={FF_MAX_CHARS_IN_COMMENT}
                />
                <div className="section__actions">
                  <Button
                    button="primary"
                    type="submit"
                    label={__('Done')}
                    requiresAuth={IS_WEB}
                    disabled={message === editedMessage}
                  />
                  <Button button="link" label={__('Cancel')} onClick={() => setEditing(false)} />
                </div>
              </Form>
            ) : (
              <>
                <div className="comment__message">
                  {editedMessage.length >= LENGTH_TO_COLLAPSE ? (
                    <Expandable>
                      <MarkdownPreview content={message} />
                    </Expandable>
                  ) : (
                    <MarkdownPreview content={message} />
                  )}
                </div>

                <div className="comment__actions">
                  {!hideReplyButton && (
                    <Button
                      requiresAuth={IS_WEB}
                      label={commentingEnabled ? __('Reply') : __('Log in to reply')}
                      className="comment__action"
                      onClick={handleCommentReply}
                      icon={ICONS.REPLY}
                    />
                  )}
                  <CommentReactions commentId={commentId} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isTopLevel && (
        <CommentsReplies
          uri={uri}
          topLevelId={topLevelId}
          linkedComment={linkedComment}
          topLevelIsReplying={isReplying}
          setTopLevelIsReplying={setReplying}
        />
      )}
    </li>
  );
}

export default Comment;
