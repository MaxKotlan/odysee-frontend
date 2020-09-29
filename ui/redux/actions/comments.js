// @flow
import * as ACTIONS from 'constants/action_types';
import * as REACTION_TYPES from 'constants/reactions';
import { Lbry, selectClaimsByUri, selectMyChannelClaims } from 'lbry-redux';
import { doToast } from 'redux/actions/notifications';
import { makeSelectCommentIdsForUri, makeSelectMyReactionsForComment } from 'redux/selectors/comments';

export function doCommentList(uri: string, page: number = 1, pageSize: number = 99999) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const claim = selectClaimsByUri(state)[uri];
    const claimId = claim ? claim.claim_id : null;

    dispatch({
      type: ACTIONS.COMMENT_LIST_STARTED,
    });
    Lbry.comment_list({
      claim_id: claimId,
      page,
      page_size: pageSize,
      include_replies: true,
      skip_validation: true,
    })
      .then((result: CommentListResponse) => {
        const { items: comments } = result;
        dispatch({
          type: ACTIONS.COMMENT_LIST_COMPLETED,
          data: {
            comments,
            claimId: claimId,
            uri: uri,
          },
        });
      })
      .catch(error => {
        dispatch({
          type: ACTIONS.COMMENT_LIST_FAILED,
          data: error,
        });
      });
  };
}

export function doCommentReactList(uri: string | null, commentId?: string) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const channel = localStorage.getItem('comment-channel');
    // if not channel, fail?
    if (!channel) {
      dispatch({
        type: ACTIONS.COMMENT_REACTION_LIST_FAILED,
        data: 'No active channel found',
      });
      return;
    }
    const commentIds = uri ? makeSelectCommentIdsForUri(uri)(state) : [commentId];
    const myChannels = selectMyChannelClaims(state);
    const claimForChannelName = myChannels.find(chan => chan.name === channel);
    const channelId = claimForChannelName && claimForChannelName.claim_id;
    dispatch({
      type: ACTIONS.COMMENT_REACTION_LIST_STARTED,
    });
    Lbry.comment_react_list({
      comment_ids: commentIds.join(','),
      channel_name: channel,
      channel_id: channelId,
    })
      .then((result: CommentReactListResponse) => {
        const { my_reactions: myReactions, others_reactions: othersReactions } = result;
        dispatch({
          type: ACTIONS.COMMENT_REACTION_LIST_COMPLETED,
          data: {
            myReactions,
            othersReactions,
          },
        });
      })
      .catch(error => {
        dispatch({
          type: ACTIONS.COMMENT_REACTION_LIST_FAILED,
          data: error,
        });
      });
  };
}

export function doCommentReact(commentId: string, type: string) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const channel = localStorage.getItem('comment-channel');
    // if not channel, fail?
    if (!channel) {
      dispatch({
        type: ACTIONS.COMMENT_REACTION_LIST_FAILED,
        data: 'No active channel found',
      });
      return;
    }
    const myChannels = selectMyChannelClaims(state);
    const myReacts = makeSelectMyReactionsForComment(commentId)(state);
    const claimForChannelName = myChannels.find(chan => chan.name === channel);
    const channelId = claimForChannelName && claimForChannelName.claim_id;
    const exclusiveTypes = {
      [REACTION_TYPES.LIKE]: REACTION_TYPES.DISLIKE,
      [REACTION_TYPES.DISLIKE]: REACTION_TYPES.LIKE,
    };

    dispatch({
      type: ACTIONS.COMMENT_REACT_STARTED,
    });
    const params: CommentReactParams = {
      comment_ids: commentId,
      channel_name: channel,
      channel_id: channelId,
      react_type: type,
    };
    if (Object.keys(exclusiveTypes).includes(type)) {
      params['clear_types'] = exclusiveTypes[type];
    }
    if (myReacts.includes(type)) {
      params['remove'] = true;
    }

    Lbry.comment_react(params)
      .then((result: CommentReactListResponse) => {
        dispatch({
          type: ACTIONS.COMMENT_REACT_COMPLETED,
        });
        dispatch(doCommentReactList(null, commentId));
      })
      .catch(error => {
        dispatch({
          type: ACTIONS.COMMENT_REACT_FAILED,
          data: error,
        });
      });
  };
}

export function doCommentCreate(
  comment: string = '',
  claim_id: string = '',
  channel: string,
  parent_id?: string,
  uri: string
) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    dispatch({
      type: ACTIONS.COMMENT_CREATE_STARTED,
    });

    const myChannels = selectMyChannelClaims(state);
    const namedChannelClaim = myChannels && myChannels.find(myChannel => myChannel.name === channel);
    const channel_id = namedChannelClaim.claim_id;

    if (channel_id == null) {
      dispatch({
        type: ACTIONS.COMMENT_CREATE_FAILED,
        data: {},
      });
      dispatch(
        doToast({
          message: 'Channel cannot be anonymous, please select a channel and try again.',
          isError: true,
        })
      );
      return;
    }

    return Lbry.comment_create({
      comment: comment,
      claim_id: claim_id,
      channel_id: channel_id,
      parent_id: parent_id,
    })
      .then((result: CommentCreateResponse) => {
        dispatch({
          type: ACTIONS.COMMENT_CREATE_COMPLETED,
          data: {
            uri,
            comment: result,
            claimId: claim_id,
          },
        });
      })
      .catch(error => {
        dispatch({
          type: ACTIONS.COMMENT_CREATE_FAILED,
          data: error,
        });
        dispatch(
          doToast({
            message: 'Unable to create comment, please try again later.',
            isError: true,
          })
        );
      });
  };
}

export function doCommentHide(comment_id: string) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.COMMENT_HIDE_STARTED,
    });
    return Lbry.comment_hide({
      comment_ids: [comment_id],
    })
      .then((result: CommentHideResponse) => {
        dispatch({
          type: ACTIONS.COMMENT_HIDE_COMPLETED,
          data: result,
        });
      })
      .catch(error => {
        dispatch({
          type: ACTIONS.COMMENT_HIDE_FAILED,
          data: error,
        });
        dispatch(
          doToast({
            message: 'Unable to hide this comment, please try again later.',
            isError: true,
          })
        );
      });
  };
}

export function doCommentAbandon(comment_id: string) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.COMMENT_ABANDON_STARTED,
    });
    return Lbry.comment_abandon({
      comment_id: comment_id,
    })
      .then((result: CommentAbandonResponse) => {
        // Comment may not be deleted if the signing channel can't be signed.
        // This will happen if the channel was recently created or abandoned.
        if (result.abandoned) {
          dispatch({
            type: ACTIONS.COMMENT_ABANDON_COMPLETED,
            data: {
              comment_id: comment_id,
            },
          });
        } else {
          dispatch({
            type: ACTIONS.COMMENT_ABANDON_FAILED,
          });
          dispatch(
            doToast({
              message: 'Your channel is still being setup, try again in a few moments.',
              isError: true,
            })
          );
        }
      })
      .catch(error => {
        dispatch({
          type: ACTIONS.COMMENT_ABANDON_FAILED,
          data: error,
        });
        dispatch(
          doToast({
            message: 'Unable to delete this comment, please try again later.',
            isError: true,
          })
        );
      });
  };
}

export function doCommentUpdate(comment_id: string, comment: string) {
  // if they provided an empty string, they must have wanted to abandon
  if (comment === '') {
    return doCommentAbandon(comment_id);
  } else {
    return (dispatch: Dispatch) => {
      dispatch({
        type: ACTIONS.COMMENT_UPDATE_STARTED,
      });
      return Lbry.comment_update({
        comment_id: comment_id,
        comment: comment,
      })
        .then((result: CommentUpdateResponse) => {
          if (result != null) {
            dispatch({
              type: ACTIONS.COMMENT_UPDATE_COMPLETED,
              data: {
                comment: result,
              },
            });
          } else {
            // the result will return null
            dispatch({
              type: ACTIONS.COMMENT_UPDATE_FAILED,
            });
            dispatch(
              doToast({
                message: 'Your channel is still being setup, try again in a few moments.',
                isError: true,
              })
            );
          }
        })
        .catch(error => {
          dispatch({
            type: ACTIONS.COMMENT_UPDATE_FAILED,
            data: error,
          });
          dispatch(
            doToast({
              message: 'Unable to edit this comment, please try again later.',
              isError: true,
            })
          );
        });
    };
  }
}
