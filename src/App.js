import React, { Component } from 'react';
import axios from 'axios';
import { sortBy } from 'lodash';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './App.css';

const DEFAULT_QUERY = 'redux';
const DEFAULT_HPP = '10';

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

const largeColumn = { width: "40%" };
const midColumn = { width: "30%" };
const smallColumn = { width: "10%" };

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, 'title'),
  AUTHOR: list => sortBy(list, 'author'),
  COMMENTS: list => sortBy(list, 'num_comments').reverse(),
  POINTS: list => sortBy(list, 'points').reverse()
}

const list = [
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
];

const Loading = () => {
  return <div>Loading ...</div>
}

const withLoading = (Component) => 
  ({isLoading, ...rest}) => 
    isLoading
    ? <Loading />
    : <Component {...rest} />

const ButtonWithLoading = withLoading(Button);

const Sort = ({
  sortKey,
  activeSortKey, 
  onSort, 
  children
}) => {
  const sortClass = classNames('button-inline', {'button-active': sortKey === activeSortKey})

  return (
    <Button 
      onClick={() => onSort(sortKey)}
      className={sortClass}
    >
      {children}
    </Button>
  );
}
  

function Button({onClick, className, children}) {
  return (
    <button
      onClick={onClick}
      className={className}
      type="button"
    >
      {children}
    </button>
  ); 
}

Button.defaultProps = {
  className: ''
}

Button.propTypes = {
  onClick: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

class Search extends Component {
  componentDidMount() {
    if (this.input) this.input.focus();
  }

  render() {
    const {
      onChange, 
      onSubmit, 
      value, 
      children
    } = this.props;
    return (
      <form onSubmit={onSubmit}>
        <input
          type="text"
          onChange={onChange}
          value={value}
          ref={el => this.input = el}
        />
        <button type="submit">
          {children}
        </button>
      </form>
    );
  }
}   

Search.deafaultProps = {
  value: ''
};

Search.propTypes = {
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  value: PropTypes.string,
  children: PropTypes.node
};

class Table extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sortKey: 'NONE',
      isSortReverse: false
    };
    this.onSort = this.onSort.bind(this);
  }

  onSort(sortKey) {
    const isSortReverse = 
      this.state.sortKey === sortKey && ! this.state.isSortReverse;
    this.setState({ sortKey, isSortReverse });
  }

  render() {
    const {
      list,
      onDismiss
    } = this.props;
    const {
      sortKey,
      isSortReverse
    } = this.state;
    const sortedList = SORTS[sortKey](list);
    const reverseSortedList = isSortReverse
      ? sortedList.reverse()
      : sortedList;
    return (
      <div className="table">
        <div className="table-header">
          <span style={{ width: '40%' }}>
            <Sort 
              sortKey={'TITLE'}
              activeSortKey={sortKey} 
              onSort={this.onSort}
            >
              Title
            </Sort>
          </span>
          <span style={{ width: '30%' }}>
            <Sort 
              sortKey={'AUTHOR'} 
              activeSortKey={sortKey}
              onSort={this.onSort}
            >
              Author
            </Sort>
          </span>
          <span style={{ width: '10%' }}>
            <Sort 
              sortKey={'COMMENTS'} 
              activeSortKey={sortKey}
              onSort={this.onSort}
            >
              Comments
            </Sort>
          </span>
          <span style={{ width: '10%' }}>
            <Sort 
              sortKey={'POINTS'} 
              activeSortKey={sortKey}
              onSort={this.onSort}
            >
              Points
            </Sort>
          </span>
          <span style={{ width: '10%' }}>
            Archive
          </span>
        </div>
        {reverseSortedList.map(item => (
          <div key={item.objectID} className="table-row">
            <span style={largeColumn}><a href={item.url}>{item.title}</a></span>
            <span style={midColumn}>{item.author}</span>
            <span style={smallColumn}>{item.num_comments}</span>
            <span style={smallColumn}>{item.points}</span>
            <span style={smallColumn}>
              <Button
                onClick={() => onDismiss(item.objectID)}
                className="button-inline"
              >
                Dismiss
              </Button>
            </span>
          </div>
        ))}
      </div>
    );
  }
}

Table.propTypes = {
  list: PropTypes.arrayOf(
    PropTypes.shape({
      objectID: PropTypes.number.isRequired,
      author: PropTypes.string,
      url: PropTypes.string,
      num_comments: PropTypes.number,
      points: PropTypes.number
    })
  ).isRequired,
  onDismiss: PropTypes.func
};


const updateSearchTopStoriesState = (hits, page) =>
  (prevState) => {
    const { searchKey, results } = prevState;
    const oldHits = results && results[searchKey] ? results[searchKey].hits : [];
    const updatedHits = [ ...oldHits, ...hits]
    return ({
      results: { 
        ...results,
        [searchKey]: {hits: updatedHits, page}
      },
      isLoading: false
    });
  }

class App extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.state = {
      results: null,
      searchKey: '',
      searchTerm: DEFAULT_QUERY,
      error: null,
      isLoading: false
    };
    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
    this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
  }

  setSearchTopStories(result) {
    const { hits, page } = result;
    
    this.setState(updateSearchTopStoriesState(hits, page));
  }

  onDismiss(id) {
    const { searchKey, results } = this.state;
    const { hits, page } = results[searchKey];
    const isNotId = (item) => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);
    this.setState({ 
      results: {
        ...results, 
        [searchKey]: { hits: updatedHits, page }
      } 
    });
  }

  onSearchChange(event) {
    this.setState({ searchTerm: event.target.value });
  }

  onSearchSubmit(event) {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });
    if (this.needsToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm);
    }
    event.preventDefault();
  }

  fetchSearchTopStories(searchTerm, page = 0) {
    this.setState({ isLoading: true });
    axios(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
      .then(result => this._isMounted && this.setSearchTopStories(result.data))
      .catch(error => this._isMounted && this.setState({ error }));
  }

  needsToSearchTopStories(searchTerm) {
    return !this.state.results[searchTerm];
  }

  componentDidMount() {
    const { searchTerm } = this.state;
    this._isMounted = true;
    this.setState({ searchKey: searchTerm });
    this.fetchSearchTopStories(searchTerm);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { 
      searchTerm,
      results,
      searchKey,
      error,
      isLoading
    } = this.state;
    const page = (results && results[searchKey] && results[searchKey].page) || 0;
    const list = (results && results[searchKey] && results[searchKey].hits) || [];
    return (
      <div className="page">
        <div className="interactions">
          <Search 
            onChange={this.onSearchChange} 
            onSubmit={this.onSearchSubmit}
            value={searchTerm}
          >
            Search
          </Search>
          <div>
            {error 
              ? (<div 
                className="interactions"
                >
                  <p>Something went wrong!</p>
                </div>) 
              : (<Table 
                list={list}
                onDismiss={this.onDismiss}
                />)
            }
            <div className="interactions">
              <ButtonWithLoading
                isLoading={isLoading}
                onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}
              >
                More
              </ButtonWithLoading>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
export {Button, Table, Search};
