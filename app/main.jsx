import React from 'react';
import ReactDOM from 'react-dom';
import Appbar from 'muicss/lib/react/appbar';
import Button from 'muicss/lib/react/button';
import Container from 'muicss/lib/react/container';

import Dropdown from 'muicss/lib/react/dropdown';
import DropdownItem from 'muicss/lib/react/dropdown-item';

import Editor from './editor.jsx';
import { BrowserFS } from './files.jsx';

let fs = window.require('fs');


require('muicss/lib/css/mui.min.css');
require('./styles.css');


class GitS extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      showSidedrawer: true
    }
  }
  toggleSidedrawer() {
    this.setState({showSidedrawer: !!!this.state.showSidedrawer})
  }

  saveEditor(){
    let content = this.refs['editor'].getContent();
    console.log("saving")
    console.log(content)
    fs.writeFile('/sources/index.md', 'content', function(){
      console.log(arguments);
    });
  }

  compile(){
    console.log("soon!")
  }

  render() {
    return (
      <div className={this.state.showSidedrawer ? 'show-sidedrawer' : 'hidden-sidedrawer'}>
      <div id="sidedrawer" className={this.state.showSidedrawer ? 'active' : 'hide'}>
        <nav>
          <div>
            <h2><a>Menu</a></h2>
          </div>
          <div className="mui-divider"></div>
          <ul>
            <li>
              <strong>Category 1</strong>
              <ul>
                <li><a href="#">Item 1</a></li>
                <li><a href="#">Item 2</a></li>
                <li><a href="#">Item 3</a></li>
              </ul>
            </li>
            <li>
              <strong>Category 2</strong>
              <ul>
                <li><a href="#">Item 1</a></li>
                <li><a href="#">Item 2</a></li>
                <li><a href="#">Item 3</a></li>
              </ul>
            </li>
            <li>
              <strong>Category 3</strong>
              <ul>
                <li><a href="#">Item 1</a></li>
                <li><a href="#">Item 2</a></li>
                <li><a href="#">Item 3</a></li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
      <header id="header">
        <Appbar>
          <span onClick={() => this.toggleSidedrawer()} className="sidedrawer-toggle icon">☰</span>
          <span className="mui--text-title">Ghost in the Safe</span>
          <Dropdown color="primary" label="actions">
            <DropdownItem onClick={() => this.saveEditor()}>Save</DropdownItem>
            <DropdownItem onClick={() => this.compile()}>Publish</DropdownItem>
          </Dropdown>
        </Appbar>
      </header>
      <div id="content">
        <Editor ref="editor">
          <h2>Other Test</h2>
        </Editor>
      </div>
      <footer id="footer">
        <Container fluid={true}>
          <br />
          Made with ♥ by Benjamin Kampmann
        </Container>
      </footer>
    </div>
    );
  }
}

ReactDOM.render(<GitS />, document.body);
