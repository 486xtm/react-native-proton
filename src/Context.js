// @flow

import * as React from 'react';
import { View, Text, Image } from 'react-native';
import stream from 'getstream';
import StreamAnalytics from 'stream-analytics';
import type { ChildrenProps } from './types';
import type {
  StreamCloudClient,
  StreamUser,
  StreamUserSession,
} from 'getstream';

const emptySession = stream.connectCloud('', '').createUserSession('', '');

export const StreamContext = React.createContext({
  session: emptySession,
  user: emptySession.user,
  userData: undefined,
  changedUserData: () => {},
});

export type AppCtx<UserData> = {|
  session: StreamUserSession<UserData>,
  user: StreamUser<UserData>,
  // We cannot simply take userData from user.data, since the reference to user
  // will stay the same all the time. Because of this react won't notice that
  // the internal fields changed so it thinks it doesn't need to rerender.
  userData: ?UserData,
  changedUserData: () => void,
  changeNotificationCounts?: any,
  analyticsClient?: any,
  notificationFeed?: any,
|};

type StreamAppProps<UserData> = {|
  appId: string,
  apiKey: string,
  token: string,
  userId: string,
  options?: {},
  analyticsToken?: string,
  realtimeToken?: string,
  notificationFeed?: {
    feedGroup?: string,
    userId?: string,
    realtimeToken?: string,
  },
  defaultUserData: UserData,
  ...ChildrenProps,
|};

type StreamAppState<UserData> = AppCtx<UserData>;

export class StreamApp<UserData> extends React.Component<
  StreamAppProps<UserData>,
  StreamAppState<UserData>,
> {
  constructor(props: StreamAppProps<UserData>) {
    super(props);
    let client: StreamCloudClient<UserData> = stream.connectCloud(
      this.props.apiKey,
      this.props.appId,
      this.props.options || {},
    );

    let session = client.createUserSession(this.props.userId, this.props.token);

    let analyticsClient;
    if (this.props.analyticsToken) {
      analyticsClient = new StreamAnalytics({
        apiKey: this.props.apiKey,
        token: this.props.analyticsToken,
      });
      analyticsClient.setUser(this.props.userId);
    }
    let notificationFeed;
    if (this.props.notificationFeed) {
      //$FlowFixMe
      notificationFeed = session.client.feed(
        this.props.notificationFeed.feedGroup || 'notification',
        this.props.notificationFeed.userId || this.props.userId,
        //$FlowFixMe
        this.props.notificationFeed.realtimeToken || session.token,
      );
    }

    //$FlowFixMe
    this.state = {
      session: session,
      user: session.user,
      userData: session.user.data,
      changedUserData: () => {
        this.setState({ userData: this.state.user.data });
      },
      notificationFeed: notificationFeed,
      notificationCounts: {
        unread: 0,
        unseen: 0,
      },
      changeNotificationCounts: (counts) => {
        //$FlowFixMe
        this.setState({ notificationCounts: counts });
      },
      analyticsClient: analyticsClient,
      realtimeToken: this.props.realtimeToken,
    };
  }

  async componentDidMount() {
    // TODO: Change this to an empty object by default
    // TODO: Maybe move this somewhere else
    await this.state.user.getOrCreate(this.props.defaultUserData);
    if (this.state.notificationFeed) {
      let results = await this.state.notificationFeed.get({ limit: 1 });
      //$FlowFixMe
      this.state.changeNotificationCounts({
        unread: results.unread,
        unseen: results.unseen,
      });
      //$FlowFixMe
      this.state.notificationFeed.subscribe;
    }

    this.state.changedUserData();
  }

  render() {
    return (
      <StreamContext.Provider value={{ ...this.state }}>
        {this.props.children || (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Image
              source={{
                uri:
                  'https://popculturalstudies.files.wordpress.com/2016/02/batman-66-6.gif',
              }}
              style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                margin: 50,
              }}
            />
            <Text style={{ fontWeight: '700', fontSize: 18 }}>
              You are now connected to Stream
            </Text>
          </View>
        )}
      </StreamContext.Provider>
    );
  }
}

export const StreamFeedContext = React.createContext();

type StreamFeedProps = {
  feedGroup: string,
  userId?: string,
} & ChildrenProps;

export class StreamCurrentFeed extends React.Component<StreamFeedProps> {
  render() {
    return (
      <StreamContext.Consumer>
        {(appCtx: AppCtx<any>) => {
          const currentFeed = appCtx.session.feed(
            this.props.feedGroup,
            this.props.userId,
          );
          return (
            <StreamFeedContext.Provider value={currentFeed}>
              {this.props.children}
            </StreamFeedContext.Provider>
          );
        }}
      </StreamContext.Consumer>
    );
  }
}
