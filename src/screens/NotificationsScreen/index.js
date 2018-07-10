import React from 'react';
import { StatusBar, ScrollView, FlatList, SafeAreaView, Image } from 'react-native'

import Notification from "../../components/Notification";
import Follow from '../../components/Notifications/Follow';

export default class EditProfileScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      notifications: [
        {
          id: '1',
          type: 'like',
          actors: [
            { user_id: 1234, user_name: 'Frit Sissing', user_image: 'https://randomuser.me/api/portraits/men/12.jpg' },
            { user_id: 1235, user_name: 'Robbert ten Brink', user_image: 'https://randomuser.me/api/portraits/men/13.jpg' },
            { user_id: 1236, user_name: 'Sybrand Niessen', user_image: 'https://randomuser.me/api/portraits/men/44.jpg' }
          ],
          object: {
            type: 'link',
            title: 'Stream | API for building activity streams and news feeds',
            description: 'Stream, scalable news feeds and activity streams as a service. iOS, Android and web.',
            content: 'Great podcast with @getstream and @feeds! Thanks guys!',
            author: '@wonderwoman',
            timestamp: '2 mins'
          }
        },
        {
          id: '2',
          type: 'follow',
          follows: [
            {
              user_id: 123,
              user_image: 'https://randomuser.me/api/portraits/women/44.jpg',
              user_name: 'Beyonce'
            },
            {
              user_id: 234,
              user_image: 'https://randomuser.me/api/portraits/women/43.jpg',
              user_name: 'Wonderwoman'
            },
            {
              user_id: 345,
              user_image: 'https://randomuser.me/api/portraits/women/23.jpg',
              user_name: 'Wonderwoman'
            },
            {
              user_id: 456,
              user_image: 'https://randomuser.me/api/portraits/women/47.jpg',
              user_name: 'Wonderwoman'
            }
          ]
        },
        {
          id: '3',
          type: 'repost',
          actors: [
            { user_id: 1234, user_name: 'Sacha de Boer', user_image: 'https://randomuser.me/api/portraits/women/12.jpg' },
          ],
          object: {
            type: 'link',
            title: 'Tree House at the Shire - Treehouses for Rent in Conway',
            image: 'http://freepost.me/wp-content/uploads/2018/01/cabin-fresh-in-best-fire-pit-area-pits.jpg',
            description: 'This quaint little cabin in the trees was designed for a true get away'
          }
        },
        {
          id: '4',
          type: 'like',
          actors: [
            { user_id: 1234, user_name: 'Sacha de Boer', user_image: 'https://randomuser.me/api/portraits/women/12.jpg' },
            { user_id: 1235, user_name: 'Robbert ten Brink', user_image: 'https://randomuser.me/api/portraits/men/13.jpg' },
            { user_id: 1236, user_name: 'Sybrand Niessen', user_image: 'https://randomuser.me/api/portraits/men/44.jpg' },
            { user_id: 1236, user_name: 'Sybrand Niessen', user_image: 'https://randomuser.me/api/portraits/men/44.jpg' }
          ],
          object: {
            type: 'repost',
            content: 'Great podcast with @getstream and @feeds! Thanks guys!',
            author: '@wonderwoman',
            timestamp: '2 months'
          }
        },
        {
          id: '5',
          type: 'repost',
          actors: [
            { user_id: 1234, user_name: 'Dirk Kuijt', user_image: 'https://randomuser.me/api/portraits/men/64.jpg' },
          ],
          object: {
            type: 'post',
            content: 'Donec gravida risus dui, sed imperdiet odio tincidunt id. Nam egestas malesuada metus sit amet pretium.',
            timestamp: '2 weeks',

          }
        },
        {
          id: '6',
          type: 'repost',
          actors: [
            { user_id: 1234, user_name: 'Derk Bolt', user_image: 'https://randomuser.me/api/portraits/men/22.jpg' },
            { user_id: 1235, user_name: 'Robbert ten Brink', user_image: 'https://randomuser.me/api/portraits/men/13.jpg' },
          ],
          object: {
            type: 'comment'
          }
        }
      ]
    }
  }

  static navigationOptions = ({ navigation }) => ({
    title: 'NOTIFICATIONS',
    headerLeft: <Image source={require('../../images/icons/categories.png')} style={{ width: 23, height: 23 }} />,
    headerRight: <Image source={require('../../images/icons/post.png')} style={{width:23, height: 23 }} />,
    headerStyle: {
      paddingLeft: 15,
      paddingRight: 15,
    },
    headerTitleStyle: {
      fontWeight: '500',
      fontSize: 13
    }
  });

  componentDidMount() {
    this._navListener = this.props.navigation.addListener('didFocus', () => {
      StatusBar.setBarStyle('dark-content');
    });
  }

  _keyExtractor = (item, index) => item.id;

  _renderItem = ({ item }) => {
    if (item.type === 'follow') {
      return <Follow items={item.follows} />;
    } else {
      return <Notification item={item} />;
    }
  }

  render() {
    return <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
        <SafeAreaView>
          <FlatList
            data={this.state.notifications}
            renderItem={this._renderItem}
            keyExtractor={this._keyExtractor}
          />
        </SafeAreaView>
      </ScrollView>;
  }
}