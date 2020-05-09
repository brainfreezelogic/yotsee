import React, { Component } from 'react';
import './App.css';
import { Board } from './Board';
import mycomputer from './images/mycomputer.png'
import recyclebin from './images/recyclebin.png'
import yotseedesktop from './images/yotseedesktop.png'
import yotseedesktopselected from './images/yotseedesktopselected.png'
import start from './images/start.png'
import systemtray from './images/systemtray.png'
import bottom from './images/bottom.png'

export interface AppState {
  yotseeState: "closed" | "loading" | "player-select" | "game";
  yotseeSelected: boolean;
}

export class App extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      yotseeState: "closed",
      yotseeSelected: false,
    }
  }

  render() {
      return (
        <div className="App">
          <img className="MyComputer" src={mycomputer} alt="My Computer" />
          <img className="RecycleBin" src={recyclebin} alt="Recylce Bin" />
          <img
            className="YotseeDesktop"
            alt="Yotsee"
            src={this.state.yotseeSelected ? yotseedesktopselected : yotseedesktop}
            onDoubleClick={() => this.setState({ yotseeState: "game" })}
            onClick={() => this.setState({ yotseeSelected: true })}
          />
          <img className="Start" src={start} alt="Start" />
          <img className="SystemTray" src={systemtray} alt="Tray" />
          <img className="Bottom" src={bottom} alt="Bottom" />
          {this.state.yotseeState === "game" && 
            <Board />
          }
        </div>
      );
  }
}

export default App;
