import React from 'react';
import ReactDOM from 'react-dom';
import renderer from 'react-test-renderer';
import App, { Search, Table, Button } from './App';

describe('App', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<App />, div);
    ReactDOM.unmountComponentAtNode(div);
  });

  it('has a valid snapshot', () => {
    const component = renderer.create(<App />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});

describe('Search', () => {
  it('renders without crash', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Search>Search</Search>, div);
    ReactDOM.unmountComponentAtNode(div);
  });

  it('has a valid snapshot', () => {
    const element = renderer.create(<Search>Search</Search>);
    const tree = element.toJSON();
    expect(tree).toMatchSnapshot();
  });
});

describe('Button', () => {
  it('renders without crash', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Button>More</Button>, div);
    ReactDOM.unmountComponentAtNode(div);
  });

  it('has a valid snapshot', () => {
    const element = renderer.create(<Button>More</Button>);
    const tree = element.toJSON();
    expect(tree).toMatchSnapshot();
  });
});

describe('Table', () => {
  const props = {
    list: [
      {
        title: 'React',
        url: 'https://reactjs.org/',
        author: 'Jordan Walke',
        num_comments: 3,
        points: 4,
        objectID: 0
      },
      {
        title: 'Redux',
        url: 'https://redux.js.org/',
        author: 'Dan Abramov, Andrew Clark',
        num_comments: 2,
        points: 5,
        objectID: 1
      }
    ]
  };

  it('renders wihtout crash', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Table {...props} />, div);
    ReactDOM.unmountComponentAtNode(div);

  });
  it('has a valid snapshot', () => {
    const element = renderer.create(<Table {...props} />);
    const tree = element.toJSON();
    expect(tree).toMatchSnapshot();
  });
});

