import { connect } from 'react-redux';
import { doFetchAccessToken, doUserSetReferrer } from 'redux/actions/user';
import { doFetchChannelListMine, doFetchCollectionListMine, doResolveUris } from 'redux/actions/claims';
import { doFetchModBlockedList, doFetchCommentModAmIList } from 'redux/actions/comments';
import { doSetLanguage } from 'redux/actions/settings';
import { doSignIn, doSetActiveChannel, doSetIncognito } from 'redux/actions/app';
import { doSyncLoop } from 'redux/actions/sync';
import { hot } from 'react-hot-loader/root';
import { selectLanguage, selectLoadedLanguages, selectThemePath } from 'redux/selectors/settings';
import { selectGetSyncErrorMessage, selectSyncFatalError } from 'redux/selectors/sync';
import { selectModal, selectActiveChannelClaim, selectIsReloadRequired } from 'redux/selectors/app';
import { selectMyChannelUrls } from 'redux/selectors/claims';
import { selectSubscriptions } from 'redux/selectors/subscriptions';
import { selectUnclaimedRewards } from 'redux/selectors/rewards';
import { selectUploadCount } from 'redux/selectors/publish';
import { selectUser, selectAccessToken, selectUserVerifiedEmail } from 'redux/selectors/user';
import App from './view';

const select = (state) => ({
  user: selectUser(state),
  accessToken: selectAccessToken(state),
  theme: selectThemePath(state),
  language: selectLanguage(state),
  languages: selectLoadedLanguages(state),
  isReloadRequired: selectIsReloadRequired(state),
  syncError: selectGetSyncErrorMessage(state),
  uploadCount: selectUploadCount(state),
  rewards: selectUnclaimedRewards(state),
  isAuthenticated: selectUserVerifiedEmail(state),
  currentModal: selectModal(state),
  syncFatalError: selectSyncFatalError(state),
  activeChannelClaim: selectActiveChannelClaim(state),
  myChannelUrls: selectMyChannelUrls(state),
  subscriptions: selectSubscriptions(state),
});

const perform = (dispatch) => ({
  fetchAccessToken: () => dispatch(doFetchAccessToken()),
  fetchChannelListMine: () => dispatch(doFetchChannelListMine()),
  fetchCollectionListMine: () => dispatch(doFetchCollectionListMine()),
  setLanguage: (language) => dispatch(doSetLanguage(language)),
  signIn: () => dispatch(doSignIn()),
  syncLoop: (noInterval) => dispatch(doSyncLoop(noInterval)),
  setReferrer: (referrer, doClaim) => dispatch(doUserSetReferrer(referrer, doClaim)),
  setActiveChannelIfNotSet: () => dispatch(doSetActiveChannel()),
  setIncognito: () => dispatch(doSetIncognito()),
  fetchModBlockedList: () => dispatch(doFetchModBlockedList()),
  resolveUris: (uris) => dispatch(doResolveUris(uris)),
  fetchModAmIList: () => dispatch(doFetchCommentModAmIList()),
});

export default hot(connect(select, perform)(App));
