import './App.css';
import Navigation from './components/Navigation/Navigation.js';
import Logo from './components/Logo/Logo.js';
import React, { Component } from 'react';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm.js';
import Rank from './components/Rank/Rank.js';
import Particles from './components/Particles';
// import Clarifai from 'clarifai';
import FaceRecognition from './components/FaceRecognition/FaceRecognition.js'
import Signin from './components/Signin/Signin.js';
import Register from './components/Register/Register.js';

// const app = new Clarifai.App({
//   apiKey: '6b4aaa203a5e483880e845bf9998a944'
//  });
 

const returnClarifaiRequestOptions = (imageUrl) => {
  // Your PAT (Personal Access Token) can be found in the portal under Authentification
  const PAT = '6b4aaa203a5e483880e845bf9998a944';
  // Specify the correct user_id/app_id pairings
  // Since you're making inferences outside your app's scope
  const USER_ID = 'a7t9483e0jay';       
  const APP_ID = 'facedetect';
  // Change these to whatever model and image URL you want to use
  // const MODEL_ID = 'face-detection';
  // const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105'; 
  const IMAGE_URL = imageUrl;

  const raw = JSON.stringify({
    "user_app_id": {
        "user_id": USER_ID,
        "app_id": APP_ID
    },
    "inputs": [
        {
            "data": {
                "image": {
                    "url": IMAGE_URL
                }
            }
        }
    ]
  });
  return {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Authorization': 'Key ' + PAT
    },
    body: raw
  };
}

const initialState = {
  input: '',
  imageUrl: '',
  box: {},
  route: 'signin',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
}

class App extends Component{
  constructor() {
    super();
    this.state = initialState;
    }
  

  loadUser = (data) => {
    this.setState({user : {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
    }})
  }

  calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height)
    }
  }

  displayFaceBox = (box) => {
    this.setState({box: box});
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value})
  }

  onButtonSubmit = () => {
    const MODEL_ID = 'face-detection';
    const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105'; 
    this.setState({imageUrl: this.state.input})
    
    fetch("https://api.clarifai.com/v2/models/" 
    + MODEL_ID + "/versions/" 
    + MODEL_VERSION_ID + "/outputs",  
    returnClarifaiRequestOptions(this.state.input))
        .then(response => response.json())
        .then(calc => {
          if(this.state.user.id) {
            fetch("https://frozen-shore-57403.herokuapp.com/image", {
              method: 'put',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                id: this.state.user.id
              })  
            })
              .then(response => response.json())
              .then(count => {
                this.setState(Object.assign(this.state.user, { entries: count}))
                console.log(count)
              })
          } else {
            console.log("User ID is undefined")
          }
          this.displayFaceBox(this.calculateFaceLocation(calc))
        })
        .catch(error => console.log('errorlmao', error));
  }

  onRouteChange = (route) => {
    let out = false;
    if (route === 'signout') {
      this.setState(initialState)
      out = true;
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    out
    ? this.setState({route: 'signin'})
    :this.setState({route: route});
  }

  render () {
    return (
    <div className="App">
      <Particles />
      <Navigation isSignedIn = {this.state.isSignedIn} onRouteChange={this.onRouteChange} />
      { this.state.route === 'home'
        ? <div>
            <Logo />
            <Rank name={this.state.user.name} entries={this.state.user.entries}/>
            <ImageLinkForm onInputChange = {this.onInputChange} onButtonSubmit = {this.onButtonSubmit} />
            <FaceRecognition box = {this.state.box} imageUrl = {this.state.imageUrl}/>
          </div>
        : (
            this.state.route === 'signin'
            ? <Signin   loadUser = {this.loadUser} onRouteChange = {this.onRouteChange}/>
            : <Register loadUser = {this.loadUser} onRouteChange = {this.onRouteChange}/>
          )
      }
    </div> 
    );
  }
}

export default App;
