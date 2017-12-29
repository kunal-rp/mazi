import React, {Component} from 'react';
import {StyleSheet,View,Text,Image} from 'react-native';

export default class MatchTopBar extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <View style={styles.container}>
        <Image
          style={styles.image}
          source={require('../res/ic_toolbar_logo.png')}
        />
        <Text style={styles.text}>Vierve </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 70,
  },
  image: {
    width: 35,
    height: 35,
    tintColor: 'white'
  },
  text: {
    fontWeight: 'bold',
    fontSize: 20,
    alignSelf: 'center',
    color: 'white'
  }
});
