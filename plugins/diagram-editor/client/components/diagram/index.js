var React = require('react');
var CloocaModelGraph = require('./clooca-model-graph-editor');

var ToolPallet = require('./tool');
var GraphComponent = require('./graph');

var diagrameditor_json = {
    "nodes": [
        {
            "name": "Rectangle",
            "type": "Index",
            "icon": "/mxgraph/editor-images/rectangle.png",
            "width": 80,
            "height": 40,
            "style": "shape=rectangle"
        },
        {
            "name": "Ellipse",
            "type": "IndexGroup",
            "icon": "/mxgraph/editor-images/ellipse.png",
            "width": 80,
            "height": 40,
            "style": "shape=ellipse"
        },
        {
            "name": "Rhombus",
            "type": "Index",
            "icon": "/mxgraph/editor-images/rhombus.png",
            "width": 80,
            "height": 40,
            "style": "shape=rhombus"
        },
        {
            "name": "Hexagon",
            "type": "Index",
            "icon": "/mxgraph/editor-images/hexagon.png",
            "width": 80,
            "height": 40,
            "style": "shape=hexagon"
        },
        {
            "name": "Cylinder",
            "type": "Index",
            "icon": "/mxgraph/editor-images/cylinder.png",
            "width": 100,
            "height": 100,
            "style": "shape=cylinder"
        },
        {
            "name": "Cloud",
            "type": "Index",
            "icon": "/mxgraph/editor-images/cloud.png",
            "width": 400,
            "height": 100,
            "style": "shape=cloud"
        }
    ],
    "connections": [
        {
            "name": "Arrow",
            "type": "Assosiation",
            "icon": "/mxgraph/editor-images/arrow.png",
            "width": 80,
            "height": 40,
            "style": "dashed=0;fontColor=blue"
        },
        {
            "name": "dottedArrow",
            "type": "Assosiation",
            "icon": "/mxgraph/editor-images/dottedarrow.png",
            "width": 80,
            "height": 40,
            "style": "dashed=1;fontColor=black"
        }
    ],
    "addNodeDefault": "Rectangle",
    "addConnectionDefault": "dottedArrow"
};
console.log(diagrameditor_json);

let editorSetting = window.editorSetting;
console.log(editorSetting);
if (editorSetting) {
  diagrameditor_json = editorSetting;
}

// diagrameditor.jsonの定義情報を取得
var mi = clooca.getModelInterface();
var rs = mi.getResourceSet();
let dg = rs.elements('Diagram')[0]

var nodes = dg.get('nodes');
var nodeList = nodes.map( (node)=>{
  return {
          name : node.get('name'),
          type : node.get('type'),
          icon : node.get('icon'),
          width : node.get('width'),
          height : node.get('height'),
          style : node.get('style')
  }
});

// diagrameditor.jsonにnodeのリストが定義されていれば
// エディタのノードの選択肢を置き換え
if (nodeList.length > 0) {
  diagrameditor_json.nodes = nodeList;
}

var connections = dg.get('connections');
var conList = connections.map( (con)=>{
  return {
          name : con.get('name'),
          type : con.get('type'),
          icon : con.get('icon'),
          width : con.get('width'),
          height : con.get('height'),
          style : con.get('style')
  }
});

// diagrameditor.jsonにconnectionのリストが定義されていれば
// エディタのコネクションの選択肢を置き換え
if (conList.length > 0) {
  diagrameditor_json.connections = conList;      
}

console.log(diagrameditor_json);

const deNodes = diagrameditor_json.nodes;
const deConns = diagrameditor_json.connections;
const defaultNode = () => {
    for ( let i = 0; i < deNodes.length; i++ ) {
        if ( deNodes[i].name == diagrameditor_json.addNodeDefault ) return deNodes[i];
    }
    return deNodes[0];
}
const defaultConn = () => {
    for ( let i = 0; i < deConns.length; i++ ) {
        if ( deConns[i].name == diagrameditor_json.addConnectionDefault ) return deConns[i];
    }
    return deConns[0];
}

function checkTypeNode(name) {
    for ( let i = 0; i < deNodes.length; i++ ) {
        if ( deNodes[i].name == name ) return true;
    }
    return false;
}

function getProperty(name) {
    let ret = {};
    for ( let i = 0; i < deNodes.length; i++ ) {
        if ( deNodes[i].name == name ) return deNodes[i];
    }
    for ( let i = 0; i < deConns.length; i++ ) {
        if ( deConns[i].name == name ) return deConns[i];
    }
    return ({});
}

let graph = null;

let DiagramEditor = React.createClass({

  getInitialState: function () {
    return {
    };
  },

  componentWillMount: function() {
    var setState = this.setState.bind(this);
    var modelInterface = clooca.getModelInterface();
    var model = modelInterface.getRawModel();
    var resourceSet = modelInterface.getResourceSet();
    let diagram = resourceSet.elements('Diagram')[0]
    let metaElement = diagram.get('metaElement');
/*
    model.on('add change remove', function(f) {
      setState({
        model: model.get('contents').first(),
      });
    });
*/
    setState({
      model: model.get('contents').first(),
      diagram: diagram
    });
  },

  componentDidMount: function () {
    // mxGraphのリソース配置場所をstaticディレクトリ配下のmxgraphに設定
    window.mxBasePath='/mxgraph/';

    // 初回表示時のモードを矩形ノードにセット
    let modeElements = document.getElementsByName('mode');
    let targetModeValue = 'select';
    window.isSelectMode = true;
    window.nodeType = checkTypeNode(defaultNode().name);
    window.nodeProperty = getProperty(defaultNode().name);
    window.isAssociationMode = false;
    modeElements.forEach(function(modeElement) {
      let modeValue = modeElement.value;
      if (modeValue === targetModeValue) {
        modeElement.checked = true;
      } else {
        modeElement.checked = false;
      }
    });

    // モード変更処理を実行
    this.changeMode(targetModeValue);
  },

  componentDidUpdate: function () {
    window.retryThreads = [];
    // Cloocaモデルのグラフエディタをリフレッシュ
    if(!this.state.model || !this.state.diagram) return;
    if ( !graph ) {
      console.log('componentDidUpdate');
      let model = this.state.model;
      let diagram = this.state.diagram;
      graph = new CloocaModelGraph(model, diagram, defaultNode(), defaultConn());
      graph.drawing();

    } else {
      graph.refresh();
    }
  },

  componentWillUnmount : function() {
  },

  onClickMetaIndexSync: function() {
    console.log('onClickMetaIndexSync');
    let retryThreads = window.retryThreads;
    if (retryThreads) {
      for (var i = 0; i < retryThreads.length; i++) {
        let thread = retryThreads[i];
        thread.restart();
      }
    }
  },

  onChangeMode : function(e) {
    let value = e.currentTarget.value;
    this.changeMode(value);
  },

  changeMode: function(value) {
    console.log(value);
    if ( value == 'select' ) {
      window.isSelectMode = true;
      //window.nodeType = false;
      window.nodeType = defaultNode().type;
      //window.nodeProperty = { "name": "select", "type": "select", "width": 100, "height": 50, style: ""};
      //window.nodeProperty = defaultNode();
      window.nodeType = checkTypeNode(defaultNode().name);
      window.nodeProperty = getProperty(defaultNode().name);
      window.isAssociationMode = false;
    } else {
      window.isSelectMode = false;
      window.nodeType = checkTypeNode(value);
      window.nodeProperty = getProperty(value);
      window.isAssociationMode = !checkTypeNode(value);
    }
    // グラフエディタのモードを変更してグラフリフレッシュを発火させる
    this.setState({
      isSelectMode: window.isSelectMode,
      isAssociationMode: window.isAssociationMode
    });
  },

  menuItem: function(props) {
    return (
          <label>
            <input type="radio" name="mode" value={props.node.name} onClick={this.onChangeMode} />
            <img src={props.node.icon} width="16" height="16" className="diagram_menu_icon" />&nbsp;:{props.node.name}
          </label>
    );
  },

  menuItems: function() {
    return (
      <div>
      <ToolPallet tools={[]}/>
        <div>
          <button onClick={this.onClickMetaIndexSync}>MetaIndexSync</button>
          {deNodes.map((node) => <this.menuItem node={node} />)}
          {deConns.map((node) => <this.menuItem node={node} />)}
          <label>
            <input type="radio" name="mode" value="select" onClick={this.onChangeMode} />
            <img src="/mxgraph/editor-images/select.png" width="16" height="16" className="diagram_menu_icon" />&nbsp;:Select
          </label>
        </div>
      </div>
    );
  },

  render: function () {
    //console.dir(this.menuItems());
    return this.menuItems();
  }
});

module.exports = DiagramEditor;
