// @flow
import React from 'react';
import { StatusBar, Text } from 'react-native';
import { EditProfileForm } from '~/components/EditProfileForm';
import { StreamContext } from '~/Context';
import BackButton from '~/components/BackButton';
import type { NavigationProps } from '~/types';
import type { NavigationEventSubscription } from 'react-navigation';

type Props = NavigationProps;

export default class EditProfileScreen extends React.Component<Props> {
  _navListener: NavigationEventSubscription;

  static navigationOptions = ({ navigation }: Props) => ({
    title: 'EDIT PROFILE',
    // TODO @Jaap: Probably Text is not the correct component here, probably
    // also good to go back to the profile page after pressing save
    headerRight: <Text onPress={navigation.getParam('saveFunc')}>Save</Text>,
    headerLeft: <BackButton pressed={() => navigation.goBack()} color="blue" />,
    headerStyle: {
      paddingLeft: 15,
      paddingRight: 15,
    },
    headerTitleStyle: {
      fontWeight: '500',
      fontSize: 13,
    },
  });

  componentDidMount() {
    this._navListener = this.props.navigation.addListener('didFocus', () => {
      StatusBar.setBarStyle('dark-content');
    });
  }

  render() {
    return (
      <StreamContext.Consumer>
        {(appCtx) => {
          return (
            <EditProfileForm
              registerSave={(saveFunc) => {
                this.props.navigation.setParams({ saveFunc });
              }}
              {...appCtx}
            />
          );
        }}
      </StreamContext.Consumer>
    );
  }
}
