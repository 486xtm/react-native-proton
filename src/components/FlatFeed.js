// @flow
import * as React from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import immutable from 'immutable';
import URL from 'url-parse';

import { StreamContext } from '../Context';
import { mergeStyles } from '../utils';
import type {
  NavigationProps,
  ChildrenProps,
  StylesProps,
  ReactElementCreator,
  BaseActivityResponse,
  BaseAppCtx,
  BaseUserSession,
  ReactComponentFunction,
} from '../types';
import type { FeedRequestOptions, FeedResponse, StreamFeed } from 'getstream';

type Props = {|
  feedGroup: string,
  userId?: string,
  options?: FeedRequestOptions,
  renderActivity?: ReactComponentFunction,
  ActivityComponent?: ReactElementCreator,
  doFeedRequest?: (
    session: BaseUserSession,
    feedGroup: string,
    userId?: string,
    options?: FeedRequestOptions,
  ) => Promise<FeedResponse<{}, {}>>,
  noPagination?: boolean,
  analyticsLocation?: string,
  ...NavigationProps,
  ...ChildrenProps,
  ...StylesProps,
|};

export default function FlatFeed(props: Props) {
  return (
    <StreamContext.Consumer>
      {(appCtx) => <FlatFeedInner {...props} {...appCtx} />}
    </StreamContext.Consumer>
  );
}

type PropsInner = {| ...Props, ...BaseAppCtx |};
type State = {
  activityOrder: Array<string>,
  activities: any,
  refreshing: boolean,
  lastResponse: ?FeedResponse<{}, {}>,
};

class FlatFeedInner extends React.Component<PropsInner, State> {
  constructor(props: PropsInner) {
    super(props);
    this.state = {
      activityOrder: [],
      activities: immutable.Map(),
      lastResponse: null,
      refreshing: false,
    };
  }

  _trackAnalytics = (
    label: string,
    activity: BaseActivityResponse,
    track: ?boolean,
  ) => {
    let analyticsClient = this.props.analyticsClient;

    if (!track || !analyticsClient) {
      return;
    }

    let feed = this.props.session.feed(this.props.feedGroup, this.props.userId);

    analyticsClient.trackEngagement({
      label: label,
      feed_id: feed.id,
      content: {
        foreign_id: activity.foreign_id,
      },
      location: this.props.analyticsLocation,
    });
  };

  _onAddReaction = async (
    kind: string,
    activity: BaseActivityResponse,
    options: { trackAnalytics?: boolean } = {},
  ) => {
    let reaction = await this.props.session.react(kind, activity);
    this._trackAnalytics(kind, activity, options.trackAnalytics);
    let enrichedReaction = immutable.fromJS({
      ...reaction,
      user: this.props.user.full,
    });

    return this.setState((prevState) => {
      let activities = prevState.activities
        .updateIn([activity.id, 'reaction_counts', kind], (v = 0) => v + 1)
        .updateIn(
          [activity.id, 'own_reactions', kind],
          (v = immutable.List()) => v.unshift(enrichedReaction),
        )
        .updateIn(
          [activity.id, 'latest_reactions', kind],
          (v = immutable.List()) => v.unshift(enrichedReaction),
        );

      return { activities };
    });
  };

  _onRemoveReaction = async (
    kind: string,
    activity: BaseActivityResponse,
    id: string,
    options: { trackAnalytics?: boolean } = {},
  ) => {
    await this.props.session.reactions.delete(id);
    this._trackAnalytics('un' + kind, activity, options.trackAnalytics);

    return this.setState((prevState) => {
      let activities = prevState.activities
        .updateIn([activity.id, 'reaction_counts', kind], (v = 0) => v - 1)
        .updateIn(
          [activity.id, 'own_reactions', kind],
          (v = immutable.List()) =>
            v.remove(v.findIndex((r) => r.get('id') === id)),
        )
        .updateIn(
          [activity.id, 'latest_reactions', kind],
          (v = immutable.List()) =>
            v.remove(v.findIndex((r) => r.get('id') === id)),
        );
      return { activities };
    });
  };

  _onToggleReaction = async (
    kind: string,
    activity: BaseActivityResponse,
    options: { trackAnalytics?: boolean } = {},
  ) => {
    let currentReactions = this.state.activities.getIn(
      [activity.id, 'own_reactions', kind],
      immutable.List(),
    );

    if (currentReactions.size) {
      await this._onRemoveReaction(
        kind,
        activity,
        currentReactions.last().get('id'),
        options,
      );
    } else {
      this._onAddReaction(kind, activity, options);
    }
  };

  _doFeedRequest = async (extraOptions) => {
    let options: FeedRequestOptions = {
      withReactionCounts: true,
      withOwnReactions: true,
      ...this.props.options,
      ...extraOptions,
    };

    if (this.props.doFeedRequest) {
      return this.props.doFeedRequest(
        this.props.session,
        this.props.feedGroup,
        this.props.userId,
        options,
      );
    } else {
      let feed: StreamFeed<{}, {}> = this.props.session.feed(
        this.props.feedGroup,
        this.props.userId,
      );
      return feed.get(options);
    }
  };
  _responseToActivityMap(response) {
    return immutable.fromJS(
      response.results.reduce((map, a) => {
        map[a.id] = a;
        return map;
      }, {}),
    );
  }

  _refresh = async () => {
    await this.setState({ refreshing: true });
    let response = await this._doFeedRequest();

    return this.setState({
      activityOrder: response.results.map((a) => a.id),
      activities: this._responseToActivityMap(response),
      refreshing: false,
      lastResponse: response,
    });
  };

  async componentDidMount() {
    await this._refresh();
  }

  _loadNextPage = async () => {
    let lastResponse = this.state.lastResponse;
    if (!lastResponse) {
      return;
    }
    let cancel = false;
    await this.setState((prevState) => {
      if (prevState.refreshing) {
        cancel = true;
        return {};
      }
      return { refreshing: true };
    });

    if (cancel) {
      return;
    }

    let nextURL = new URL(lastResponse.next, true);
    let response = await this._doFeedRequest(nextURL.query);
    return this.setState((prevState) => {
      let activities = prevState.activities.merge(
        this._responseToActivityMap(response),
      );
      return {
        activityOrder: prevState.activityOrder.concat(
          response.results.map((a) => a.id),
        ),
        activities: activities,
        refreshing: false,
        lastResponse: response,
      };
    });
  };

  _renderActivity = ({ item }: { item: BaseActivityResponse }) => {
    let args = {
      activity: item,
      onToggleReaction: this._onToggleReaction,
      onAddReaction: this._onAddReaction,
      onRemoveReaction: this._onRemoveReaction,
      navigation: this.props.navigation,
      feedGroup: this.props.feedGroup,
      userId: this.props.userId,
    };

    if (this.props.renderActivity) {
      return this.props.renderActivity(args);
    }

    if (this.props.ActivityComponent) {
      let ActivityComponent = this.props.ActivityComponent;
      return <ActivityComponent {...args} />;
    }

    return null;
  };

  render() {
    return (
      <FlatList
        ListHeaderComponent={this.props.children}
        style={mergeStyles('container', styles, this.props)}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this._refresh}
          />
        }
        data={this.state.activityOrder.map((id) =>
          this.state.activities.get(id).toJS(),
        )}
        keyExtractor={(item) => item.id}
        renderItem={this._renderActivity}
        onEndReached={this.props.noPagination ? undefined : this._loadNextPage}
      />
    );
  }
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
