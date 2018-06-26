import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

import UserBar from '../../UserBar';
import Card from "../../Card";
import PostControlBar from "../../PostControlBar";

const Repost = ({ item }) => {
  return (
    <View style={styles.item}>
      <UserBar
        data={{ username: 'Wonderwoman', handle: 'reposted your ' + item.object.type  }}/>

      { item.object.type === 'link' ?
        <Card item={{title: item.object.title, description: item.object.description}}/>
      : null }

      { item.object.type === 'post' ?
        <View style={{marginLeft: 58, marginTop: 15}}>
          <Text>post</Text>
        </View>
      : null }

      { item.object.type === 'comment' ?
      <View style={{ marginLeft: 58, marginTop: 15 }}>
        <Text>comment</Text>
      </View>
      : null}

    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    borderBottomWidth: 1,
    borderBottomColor: "#DADFE3",
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 12,
    paddingRight: 12
  },

});

export default Repost;
