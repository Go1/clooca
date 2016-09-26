var React = require('react');
var Resource = require('./resource');
var transformer = require('../../transformer');

let ExplorerComponent = React.createClass({

  getInitialState: function () {
    return {
    };
  },

  componentWillMount: function() {
    var setState = this.setState.bind(this);
    var modelInterface = clooca.getModelInterface();
    var resourceSet = modelInterface.getResourceSet();
    modelInterface.on('model.change', function(resource) {
      setState({
        resource: resource,
        resourceSet: resourceSet
      });
    });
    setState({
      resource: modelInterface.getCurrentModel(),
      resourceSet: resourceSet
    });
  },

  componentDidMount: function () {
  },

  componentDidUpdate: function () {
  },

  componentWillUnmount: function() {
  },

  addObject: function() {
    let cc = clooca.getCC();
    cc.request('clooca', 'modal', {
      isOpenAddObjectModal: true,
      uri: this.state.resource.get('uri')
    }).then((_settings) => {
    });
  },

  render: function () {
    return (
      <div>
      {this.state.resource?(<Resource resource={this.state.resource} resourceSet={this.state.resourceSet}></Resource>):
      (<div><a style={{cursor:'pointer', color:'#333'}} onClick={this.addObject}>最初のオブジェクトを作成する。</a></div>)}
      </div>
    );
  }
});

module.exports = ExplorerComponent;