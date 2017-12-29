import React, {Component} from 'react';
import {BackHandler, View} from 'react-native';

import MatchFrameOverlay from './MatchFrameOverlay';

class MatchOverlayControl extends Component {
	constructor(props) {
		super(props);
		this.getDirections = this.getDirections.bind(this);
		this.setLocation = this.setLocation.bind(this);
		this.state= {
			screen : 0,
			riding: false,
		};
	}

	componentDidMount() {
		BackHandler.addEventListener('androidBackPress', function() {
			console.log("hello test backpressing")
		});
	}

	getDirections() {

	}

	setLocation() {

	}

	render(){
		const screen = this.state.screen;
		let overlay = null;

		if(screen == 0){
			overlay = <MatchFrameOverlay getDirections={this.getDirections} locationSet={this.setLocation} onGetPosition={this.props.getCurrentPosition}/>;
		}

		return(
			overlay
		);
	}
}

export default MatchOverlayControl