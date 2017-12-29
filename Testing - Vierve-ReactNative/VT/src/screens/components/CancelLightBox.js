import React from 'react';
import {StyleSheet, View, Text, Dimensions, TouchableOpacity, Button} from 'react-native';

class CancelLightBox extends React.Component {

  render() {
    return (
      <View style={styles.container}>
        <View style={{flex: 8}}>
          <Text style={styles.title}>Please Read!</Text>
          <Text style={styles.content}>Do you really want to cancel this match?</Text>
          <Text style={styles.content}>You may receive a bad rating.</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => this.props.onClose()} underlayColor="white">
            <View style={styles.button}>
              <Text style={styles.buttonText}>CONFIRM</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: Dimensions.get('window').width * 0.7,
    height: Dimensions.get('window').height * 0.3,
    backgroundColor: '#2F2F2F',
    borderRadius: 5,
    padding: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white'
  },
  content: {
    marginTop: 8,
    color: 'white'
  },
  buttonContainer: {
    flex: 2, 
    alignItems: 'flex-end',

  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2196F3',
  },
  buttonText: {
    padding: 7,
    color: 'white'
  },
});

export default CancelLightBox;
