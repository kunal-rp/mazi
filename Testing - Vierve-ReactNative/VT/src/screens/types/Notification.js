import React from 'react';
import {StyleSheet, View, Text, Dimensions, Button} from 'react-native';

class Notification extends React.Component {

  render() {
  	let title = null
  	if(this.props.type==1) title="Success";
  	else title="Sorry";

    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.content}>{this.props.message}!</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    backgroundColor: '#ff505c',
    padding: 5,
    paddingLeft: 10,
    paddingRight: 10,
    margin: 16,
    
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
  },
  content: {
    textAlign: 'center',
    marginTop: 10,
  },
});

export default Notification;