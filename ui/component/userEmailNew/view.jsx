// @flow
import { SIMPLE_SITE } from 'config';
import { FormField, Form } from 'component/common/form';
import { useHistory } from 'react-router-dom';
import * as PAGES from 'constants/pages';
import * as REGEX from 'constants/regex';
import analytics from 'analytics';
import Button from 'component/button';
import Card from 'component/common/card';
import classnames from 'classnames';
import ErrorText from 'component/common/error-text';
import I18nMessage from 'component/i18nMessage';
import LoginGraphic from 'component/loginGraphic';
import Nag from 'component/common/nag';
import React, { useState } from 'react';

type Props = {
  balance: number,
  emailExists: boolean,
  errorMessage: ?string,
  interestedInYoutubSync: boolean,
  isPending: boolean,
  syncEnabled: boolean,
  clearEmailEntry: () => void,
  doSignUp: (string, ?string) => Promise<any>,
  doToggleInterestedInYoutubeSync: () => void,
};

function UserEmailNew(props: Props) {
  const {
    emailExists,
    errorMessage,
    interestedInYoutubSync,
    isPending,
    clearEmailEntry,
    doSignUp,
    doToggleInterestedInYoutubeSync,
  } = props;

  const {
    push,
    location: { search },
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const emailFromUrl = urlParams.get('email');
  const defaultEmail = emailFromUrl ? decodeURIComponent(emailFromUrl) : '';

  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');

  const valid = email.match(REGEX.EMAIL);

  function handleSubmit() {
    doSignUp(email, password === '' ? undefined : password).then(() => {
      analytics.emailProvidedEvent();
    });
  }

  const handleChangeToSignIn = React.useCallback(
    (additionalParams) => {
      clearEmailEntry();

      let url = `/$/${PAGES.AUTH_SIGNIN}`;
      const urlParams = new URLSearchParams(search);

      urlParams.delete('email');
      if (email) {
        urlParams.set('email', encodeURIComponent(email));
      }

      urlParams.delete('email_exists');
      if (emailExists) {
        urlParams.set('email_exists', '1');
      }

      push(`${url}?${urlParams.toString()}`);
    },
    [clearEmailEntry, email, emailExists, search, push]
  );

  React.useEffect(() => {
    if (emailExists) {
      handleChangeToSignIn();
    }
  }, [emailExists, handleChangeToSignIn]);

  return (
    <div
      className={classnames('main__sign-up', {
        'main__sign-up--graphic': SIMPLE_SITE,
      })}
    >
      <Card
        title={__('Join')}
        actions={
          <div>
            <Form onSubmit={handleSubmit} className="section">
              <FormField
                autoFocus
                placeholder={__('yourstruly@example.com')}
                type="email"
                name="sign_up_email"
                label={__('Email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <FormField
                type="password"
                name="sign_in_password"
                label={__('Password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <FormField
                type="checkbox"
                name="youtube_sync_checkbox"
                label={__('Sync my YouTube channel')}
                checked={interestedInYoutubSync}
                onChange={() => doToggleInterestedInYoutubeSync()}
              />

              <div className="section__actions">
                <Button
                  button="primary"
                  type="submit"
                  label={__('Sign Up')}
                  disabled={!email || !password || !valid || isPending}
                />
                <Button button="link" onClick={handleChangeToSignIn} label={__('Log In')} />
              </div>
              <p className="help--card-actions">
                <I18nMessage
                  tokens={{
                    terms: <Button button="link" href="https://odysee.com/$/tos" label={__('terms')} />,
                  }}
                >
                  By creating an account, you agree to our %terms% and confirm you're over the age of 13.
                </I18nMessage>
              </p>
            </Form>
          </div>
        }
        nag={<>{errorMessage && <Nag type="error" relative message={<ErrorText>{errorMessage}</ErrorText>} />}</>}
        secondPane={SIMPLE_SITE && <LoginGraphic />}
      />
    </div>
  );
}

export default UserEmailNew;
