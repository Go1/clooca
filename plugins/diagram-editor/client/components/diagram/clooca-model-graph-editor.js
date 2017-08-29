var MetaIndexAPI = require('./metaindex-api');

module.exports = class CloocaModelGraph {
  constructor(model, diagram, defaultNode, defaultConn) {
    this.model = model;
    this.diagram = diagram;
    this.defaultNode = defaultNode;
    this.defaultConn = defaultConn;
    this.mx = require('mxgraph-js');
    this.graphModel = new this.mx.mxGraphModel();

    // 追加済みのグラフ描画用キャンバスを削除
    let graphDivId = 'graphDiv';
    let existingContainer = document.getElementById(graphDivId);
    if (existingContainer) {
      existingContainer.remove();
    }

    // グラフ描画用のキャンバスを追加
    let container = document.createElement('div');
    container.id = graphDivId;
    container.style.background = 'url("/mxgraph/editor-images/grid.gif")';
    document.body.appendChild(container);

    this.graph = new this.mx.mxGraph(container, this.graphModel);
  }

  drawing() {
    console.log('Drawing!!!');

    let model = this.model;
    let diagram = this.diagram;
    let defaultNode = this.defaultNode;
    let defaultConn = this.defaultConn;
    //console.dir(defaultNode);
    //console.dir(defaultConn);
    //console.log('DEFAULT: ' + defaultNode.name + '/' + defaultConn.name);

    let mx = this.mx;
    let graph = this.graph;
    let graphModel = this.graphModel;
    let selModel = graph.getSelectionModel();
    graph.centerZoom = false;
    graph.setPanning(true);
    //graph.panningHandler.useLeftButtonForPanning = true;
    //console.dir(graph);

    let eventFlag = false;

    // コネクションの端点をノードから外せないように
    graph.setAllowDanglingEdges(false);
    // コネクションをドラッグで移動できないように
    graph.setDisconnectOnMove(false);

    this.refresh();

    let nodeCfInfo = {};

    // cloocaモデルからノードのリストを抽出
    let nodes = diagram.get('nodes');
    //console.dir(nodes);
    let nodeList = nodes.map( (node)=>{return node;} );
    //console.dir(nodeList);
    let cfNames = [];
    let gnodes = nodeList.reduce((acc, node) => {
      let metaElement = node.get('metaElement');
      let containFeature = node.get('containFeature');
      let cfName = containFeature.get('name');

      // ノードの格納先となるcontainFeature名を保持しておく
      nodeCfInfo[node.get('name')] = cfName;

      if (cfNames.indexOf(cfName) < 0) {
        cfNames.push(cfName);
        let cfInstances = model.get(cfName || 'classes');
        let cfInstanceList = cfInstances.map(function(_class) {
          return _class;
        });
        return acc.concat(cfInstanceList);
      } else {
        return acc;
      }
    }, []);
    let cloocaNodes = {};
    gnodes.forEach(function(node) {
      let name = node.get('name');
      if (name) {
        cloocaNodes[name] = node;
      }
    });
    //console.dir(cloocaNodes);

    // ノード名リストを抽出
    let nodeNames = gnodes.map(function(node) {
      let name = node.get('name');
      return name + '';
    });
    console.log(nodeNames);
    // ノード名リストをMetaIndexAPIに通知
    MetaIndexAPI.postIndexes(nodeNames, function() {
      console.warn('Failed to postIndexes');
    });

    // 指定した名称リストに一致するcellを選択状態にする関数を定義
    let setGraphCellSelection = function(targetCellValues) {
      selModel.clear();  // 選択クリア
      let cells = graph.getModel().cells;
      console.log(cells);
      if (!cells) {
        return;
      }
      for (let cellKey in cells) {
        let cell = cells[cellKey];
        console.log(cell);
        let cellValue = cell.value;
        console.log(cellValue);
        console.log(targetCellValues);
        let indexOfTarget = targetCellValues.indexOf(cellValue + '');
        console.log(indexOfTarget);
        if (indexOfTarget >= 0) {
          selModel.addCell(cell);  // 選択対象追加
        }
      }
      graph.setSelectionModel(selModel);  // 選択実行
    }

    // IndexのIndexedContainersを変更する関数を定義
    let changeCloocaNodeIndexedContainers = function(indexID, indexedContainerID) {
      console.log(indexID, indexedContainerID);
      if (!indexID) return;
      if (!indexedContainerID) return;

      let node = cloocaNodes[indexID];
      console.log(node);
      if (!node) return;

      node.set('indexedContainers', indexedContainerID);
    };

    // API経由でMetaIndexと同期
    let getSelectedIndexes = function(onSuccess, onFail) {
      // MetaIndexAPIから取得した選択中ノードを選択状態にする
      MetaIndexAPI.getSelectedIndexes(function(selectedNames) {
        console.log(selectedNames);
        setGraphCellSelection(selectedNames);

        onSuccess();
      }, function() {
        console.warn('Failed to getSelectedIndexes');

        onFail();
      });
    };

    let getCommand = function(onSuccess, onFail) {
      // MetaIndexAPIから取得した命令キャッシュをもとにindexedContainersを更新
      MetaIndexAPI.getCommand(function(res) {
        console.log(res);
        let indexID = res.index_id;
        let attributeName = res.attribute_name;
        let indexedContainerID = res.indexed_container_id;
        console.log(indexID, attributeName, indexedContainerID);

        if (!indexID) return;
        if (!indexedContainerID) return;

        changeCloocaNodeIndexedContainers(indexID, indexedContainerID);

        onSuccess();
      }, function() {
        console.warn('Failed to getCommand');

        onFail();
      });
    };

    let postModel = function(onSuccess, onFail) {
      let modelJson = clooca.getModelInterface().getModelJSON();
      console.log(modelJson);
      if (modelJson) {
        let data = modelJson['data'];
        console.log(data);
        if (data) {
          MetaIndexAPI.postModel(data, function(res) {
            console.log(res);

            onSuccess();
          }, function() {
            console.warn('Failed to postModel');

            onFail();
          });
        }
      }
    };

    class RetryThread {
      constructor(proc) {
        this.retryProc = proc;
        this.timeoutID = 0;
        this.delay0 = 0;
      }

      initialDelay() {
        this.delay0 = 1 * 1000;
      }

      start() {
        this.initialDelay();

        // 数秒後に同じ関数を呼び続けるループ処理
        let proceedLoop0 = function() {
          console.log('delay0', this.delay0);

          this.retryProc(function() {
            this.timeoutID = setTimeout(function() {
              console.log('proc timeoutID=', this.timeoutID);
              proceedLoop0();
            }.bind(this), this.delay0);
            console.log('');
          }.bind(this), function() {
            // 失敗時は次の処理までの時間を倍倍にする
            this.delay0 *= 2;
            this.timeoutID = setTimeout(function() {
              console.log('proc timeoutID=', this.timeoutID);
              proceedLoop0();
            }.bind(this), this.delay0);
          }.bind(this));
        }.bind(this);

        proceedLoop0();
      }

      restart() {
        console.log('restart timeoutID=', this.timeoutID);
        window.clearTimeout(this.timeoutID);
        this.initialDelay();
        this.start();
      }
    }

    // MetaIndexAPIから定期的に選択中ノードを取得し、取得したノードを選択状態にする
    let thread;
    // 選択中Index取得
    thread = new RetryThread(getSelectedIndexes);
    thread.start();
    window.retryThreads.push(thread);
    // MetaIndexからのコマンド取得
    thread = new RetryThread(getCommand);
    thread.start();
    window.retryThreads.push(thread);
    // cloocaモデル送信
    thread = new RetryThread(postModel);
    thread.start();
    window.retryThreads.push(thread);

    // ノードの描画スタイルを設定
    let w = nodeProperty.width;
    let h = nodeProperty.height;
    let style = nodeProperty.style;
    let vertex = new mx.mxCell(null, new mx.mxGeometry(0, 0, w, h), style);
    vertex.setVertex(true);

    // cloocaモデル中のノードをグラフ上に描画
    let vertexes = {};
    let parent = graph.getDefaultParent();
    gnodes.forEach(function(node) {
      //console.dir(node);
      let name = node.get('name');
      let x = node.get('x');
      let y = node.get('y');
      let w = node.get('width');
      let h = node.get('height');
      if ( !w || !h ) {
          w = 80;
          h = 40;
      }

      let style = node.get('style');
      let eClassName = node.eClass.get('name');
      if (!style) {
          if (eClassName === 'Index') {
            style = 'shape=rectangle';
          } else {
            style = 'shape=ellipse';
          }
      }

      let vertex = graph.insertVertex(parent, null, name, x, y, w, h, style);
      vertexes[name] = vertex;
    });

    // cloocaモデルからコネクションのリストを抽出
    //console.dir(diagram.get('connections'));
    let connections = diagram.get('connections').map( (connection)=>{return connection;} );
    //console.dir(connections);
    let gconnections = gnodes.map(function(node) {
      return connections.reduce((acc, connection) => {
        let metaElement = connection.get('metaElement');
        let containFeature = connection.get('containFeature');
        return acc.concat(node.get(containFeature.get('name')).map(function(_class) {
          return _class;
        }));
      }, []);
    });
    //console.dir(gconnections);
    let ftat_gconnections = Array.prototype.concat.apply([], gconnections);
    //console.dir(ftat_gconnections);
    let cloocaConnections = {};
    ftat_gconnections.forEach(function(conn) {
      let source = conn.get('source');
      if (source) {
        let sourceName = source.get('name');
        let name = conn.get('name');
        if (cloocaConnections[sourceName]) {
          cloocaConnections[sourceName][name] = conn;
        } else {
          cloocaConnections[sourceName] = {};
          cloocaConnections[sourceName][name] = conn;
        }
      }
    });
    //console.dir(cloocaConnections);

    // cloocaモデル中のコネクションをグラフ上に描画
    ftat_gconnections.forEach(function(conn) {
      //console.dir(conn);
      let source = conn.get('source');
      let target = conn.get('target');
      if (!source || !target) {
        return;
      }
      let sourceName = source.get('name');
      let targetName = target.get('name');
      if (!sourceName || !targetName) {
        return;
      }
      let sourceVertex = vertexes[sourceName];
      let targetVertex = vertexes[targetName];
      if (!sourceVertex || !targetVertex) {
        return;
      }
      let name = conn.get('name');
      let style = conn.get('style');
      if ( !style ) style = 'dashed=1;fontColor=#00CC00;';
      graph.insertEdge(parent, null, name, sourceVertex, targetVertex, style);
    });

    let Notify_editNode_To_API = function(nodes, mode) {
      // ノードの追加・変更・削除をAPIに通知
      MetaIndexAPI.editIndexes(nodes, function() {
        console.warn('Failed to editIndexes ' + mode, nodes);
      }, mode);

      // ノード名が変更されたら、選択中ノードのJSONをクリアして変更後の名称をセット
      if (mode === 'change') {
        MetaIndexAPI.setSelectedIndexes([]);
        MetaIndexAPI.setSelectedIndexes([nodes.next[0].name]);
      }
    };

    let addCloocaNode = function(instanceName, x, y) {
      if (window.isSelectMode) {
        return;
      }
      if (window.isAssociationMode) {
        return;
      }
      let className = nodeProperty.type;
      console.log('addCloocaNode: className=' + className);
      let modelInterface = clooca.getModelInterface();
      let resourceSet = modelInterface.getResourceSet();
      let eClass = resourceSet.elements('EClass').filter((eClass) => {
        return eClass.get('name') == className;
      })[0];
      //console.dir(eClass);
      let classInstance = eClass.create(
        {
          name: instanceName,
          x: x,
          y: y,
          width: nodeProperty.width,
          height: nodeProperty.height,
          style: nodeProperty.style
        }
      );

      // 追加したノードを、対応するモデルのcontainFeatureに追加する
      model.get(nodeCfInfo[nodeProperty.name]).add(classInstance);

      cloocaNodes[instanceName] = classInstance;

      // ノードの追加をAPIに通知
      Notify_editNode_To_API([{name: instanceName + ''}], 'add');
    };

    let addCloocaNode2 = function(instanceName, x, y) {
      if (!window.isSelectMode) {
        return;
      }
      let className = defaultNode.type;
      console.log('addCloocaNode2: className=' + className);
      let modelInterface = clooca.getModelInterface();
      let resourceSet = modelInterface.getResourceSet();
      let eClass = resourceSet.elements('EClass').filter((eClass) => {
        return eClass.get('name') == className;
      })[0];
      let classInstance = eClass.create(
        {
          name: instanceName,
          x: x,
          y: y,
          width: defaultNode.width,
          height: defaultNode.height,
          style: defaultNode.style
        }
      );

      // 追加したノードを、対応するモデルのcontainFeatureに追加する
      model.get(nodeCfInfo[defaultNode.name]).add(classInstance);

      cloocaNodes[instanceName] = classInstance;

      // ノードの追加をAPIに通知
      Notify_editNode_To_API([{name: instanceName + ''}], 'add');
    };

    // ノードがクリックされたときに選択されたノードの名称をMetaIndexAPIに通知
    graph.addListener(mx.mxEvent.CLICK, function(sender, evt) {
      console.log('mxEvent.CLICK');
/* Select状態でなくても、APIに選択通知を行う
      if (!window.isSelectMode) {
        return;
      }
*/
      let cell = evt.getProperty('cell');
      if (!cell) {
        // ノード以外の場所がクリックされたらAPIに選択解除を通知
        MetaIndexAPI.setSelectedIndexes([]);
        return;
      }
      let cellValue = cell.value;
      console.log(cellValue);
      if (!cellValue) {
        return;
      }
      let indexNames = [cellValue + ''];
      console.log(indexNames);
      MetaIndexAPI.setSelectedIndexes(indexNames);
    });

    // グラフ上のノード追加をcloocaモデルに反映
    graph.addListener(mx.mxEvent.DOUBLE_CLICK, function(sender, evt) {
      console.log('mxEvent.DOUBLE_CLICK');

      if (window.isSelectMode) {
        return;
      }
      let cell = evt.getProperty('cell');
      if (cell) {
        return;
      }
      
      // Assosiationの追加は不可（ノード間のドラッグ&ドロップのみ可能）
      if (nodeProperty.type === 'Assosiation') {
        return;
      }

      let instanceName = new Date().getTime();
      let event = evt.getProperty('event');
      let x = event.offsetX;
      let y = event.offsetY;
      addCloocaNode(instanceName, x, y);
      let w = nodeProperty.width, h = nodeProperty.height;
      let style = nodeProperty.style;
      let vertex = graph.insertVertex(parent, null, instanceName, x, y, w, h, style);
      vertexes[instanceName] = vertex;

      // 今追加したノードの選択を通知
      let indexNames = [instanceName + ''];
      console.log(indexNames);
      MetaIndexAPI.setSelectedIndexes(indexNames);

      // 今追加したノードを選択状態にする
      setGraphCellSelection(indexNames);

      // 今追加したノードを編集状態にする
      graph.startEditingAtCell(vertex);

      evt.consume();
    });
/*
    graph.addListener(mx.mxEvent.CLICK, function(sender, evt) {
      console.log('mxEvent.CLICK');
      let cell = evt.getProperty('cell');
      if (!cell) {
        return;
      }
      for ( let i in graph.getModel().cells ) {
          if ( graph.getModel().cells[i].value == cell.value ) {
              selModel.addCell(graph.getModel().cells[i]);
              graph.setSelectionModel(selModel);
              break;
          }
      }
      console.dir(selModel);
      evt.consume();
    });
*/
    let addCloocaConnection = function(name, sourceNode, targetNode, style) {
      //console.log('addCloocaConnection');
      //console.dir(sourceNode);
      //console.dir(targetNode);
      let modelInterface = clooca.getModelInterface();
      let resourceSet = modelInterface.getResourceSet();
      let model = modelInterface.getCurrentModel();
      if ( !style ) {
          style = nodeProperty.style;
      }
      model.each(function(iterator) {
        let associations = sourceNode.get('associations');
        let associationEclass = resourceSet.elements('EClass').filter((eClass) => {
          return eClass.get('name') == 'Association';
        })[0];
        let association = associationEclass.create(
          {
            name: name,
            source: sourceNode,
            target: targetNode,
            style: style
          }
        );
        associations.add(association);
        if (cloocaConnections[sourceNode.values.name]) {
          cloocaConnections[sourceNode.values.name][name] = association;
        } else {
          cloocaConnections[sourceNode.values.name] = {};
          cloocaConnections[sourceNode.values.name][name] = association;
        }
      });
    };

    let addCloocaConnection2 = function(name, sourceNode, targetNode) {
      //console.log('addCloocaConnection2');
      //console.dir(sourceNode);
      //console.dir(targetNode);
      let modelInterface = clooca.getModelInterface();
      let resourceSet = modelInterface.getResourceSet();
      let model = modelInterface.getCurrentModel();
      model.each(function(iterator) {
        let associations = sourceNode.get('associations');
        let associationEclass = resourceSet.elements('EClass').filter((eClass) => {
          return eClass.get('name') == 'Association';
        })[0];
        let association = associationEclass.create(
          {
            name: name,
            source: sourceNode,
            target: targetNode,
            style: defaultConn.style
          }
        );
        associations.add(association);
        if (cloocaConnections[sourceNode.values.name]) {
          cloocaConnections[sourceNode.values.name][name] = association;
        } else {
          cloocaConnections[sourceNode.values.name] = {};
          cloocaConnections[sourceNode.values.name][name] = association;
        }
      });
    };

    // グラフ上のコネクション追加をcloocaモデルに反映
    graph.connectionHandler.addListener(mx.mxEvent.CONNECT, function(sender, evt) {
      console.log('mxEvent.CONNECT');
      let edge = evt.getProperty('cell');
      let source = graph.getModel().getTerminal(edge, true);
      let target = graph.getModel().getTerminal(edge, false);
      if (!source || !target) {
        console.log('mxEvent.CONNECT error(1)');
        return;
      }
      let sourceName = source.value;
      let targetName = target.value;
      let sourceNode = cloocaNodes[sourceName];
      let targetNode = cloocaNodes[targetName];
      if (!sourceNode || !targetNode) {
        console.log('mxEvent.CONNECT error(2)');
        return;
      }
      let name = new Date().getTime();
      addCloocaConnection(name, sourceNode, targetNode, null);
      let sourceVertex = vertexes[sourceName];
      let targetVertex = vertexes[targetName];
      style = nodeProperty.style;
      graph.insertEdge(parent, null, name, sourceVertex, targetVertex, style);
    });

    let changeCloocaConnectionName = function(sourceNodeName, previous, next) {
      let sourceNode = cloocaConnections[sourceNodeName];
      if (!sourceNode) {
        return;
      }
      let conn = sourceNode[previous];
      if (!conn) {
        return;
      }
      conn.set('name', next);
    };

    let changeCloocaNodeName = function(cloocaNodes, previous, next) {
      let node = cloocaNodes[previous];
      if (!node) {
        console.log('node not exists');
        return;
      }
      node.set('name', next);
    }

    let changeCloocaNodeGeo = function(cloocaNodes, nodeName, geometry) {
      if (!geometry) {
        return;
      }
      let node = cloocaNodes[nodeName];
      let x = geometry.x;
      let y = geometry.y;
      let w = geometry.width;
      let h = geometry.height;
      if (node && x && y) {
        //console.log('xAxis:' + x + ', yAxis:' + y);
        node.set('x', x);
        node.set('y', y);
      }
      if (node && w && h) {
        //console.log('width:' + w + ', height:' + h);
        node.set('width', w);
        node.set('height', h);
      }
      //console.dir(node);
    };

    // グラフ上の以下の変更をcloocaモデルに反映
    // - 名称の変更
    // - 座標(x,y)の変更
    // - エッジの付け替え
    graph.model.addListener(mx.mxEvent.CHANGE, function(sender, evt) {
      console.log('mxEvent.CHANGE');
      if (eventFlag) return;

      let changes = evt.getProperty('edit').changes;
      //console.dir(changes);

      console.log('CHANGE: count = ' + changes.length);
      for (let i = 0; i < changes.length; i++) {
        let change = changes[i];
        console.dir(change);

        let cell = change.cell;
        if (!cell) {
          continue;
        }
        if (cell.value == null) {
          continue;
        }
        //console.dir(cell);
        let previous = change.previous;
        let next = change.value;
        if (previous && next) {  // 名称変更
          if (previous == next) continue;

          if ( cell.edge ) {
            console.log('edge name: ' + previous + " => " + next);
            // 名称重複チェック
            if (cloocaConnections[next]){
              console.log('detected duplicate connection name:' + next);
              cell.value = change.previous;
              continue;
            }
            let src = cloocaNodes[cell.source.value];
            let dst = cloocaNodes[cell.target.value];
            if ( src.values.hold && dst.values.hold ) { // 変更可否
                cell.value = change.previous;
                continue;
            }
            let sourceNodeName = cell.source.value;
            changeCloocaConnectionName(sourceNodeName, previous, next);
            cloocaConnections[next] = cloocaNodes[previous];
            delete cloocaConnections[previous];
            console.log('edge name change');
          } else {
            console.log('node name: ' + previous + " => " + next);
            // 名称重複チェック
            if (cloocaNodes[next]){
              console.log('detected duplicate node name:' + next);
              change.cell.value = change.previous;
              continue;
            }
            let node = cloocaNodes[previous];
            if ( node && node.values.hold ) { // 変更可否
              change.cell.value = change.previous;
                continue;
            }
            changeCloocaNodeName(cloocaNodes, previous, next);
            cloocaNodes[next] = cloocaNodes[previous];
            delete cloocaNodes[previous];
            graph.cellLabelChanged(cell, next);

            // ノードの名称変更をAPIに通知(古い名称のノードを削除して新しい名称を追加)
            let indexes = {prev: '', next: ''};
            indexes['prev'] = [{name: previous + ''}];
            indexes['next'] = [{name: next + ''}];
            Notify_editNode_To_API(indexes, 'change');

            console.log('node name change');
          }
        } else {  // 座標変更
          if ( change.previous != null && cell.edge ) {
            console.log('edge geometry change: ' + cell.value);
            let src = cloocaNodes[cell.source.value];
            let dst = cloocaNodes[cell.target.value];
            let prev = cloocaNodes[change.previous.value];
            let term = cloocaNodes[change.terminal.value];
            if ( change.terminal.value == cell.source.value ) { //source change
                if ( dst.values.hold && prev.values.hold ) { // 変更可否
                    change.cell.source = change.previous;
                    continue;
                }
                edgeRemove(cell.value);
                addCloocaConnection(cell.value, src, dst, cell.style);
            }
            if ( change.terminal.value == cell.target.value ) { //target change
                if ( src.values.hold && prev.values.hold ) { // 変更可否
                    change.cell.target = change.previous;
                    continue;
                }
                edgeRemove(cell.value);
                addCloocaConnection(cell.value, src, dst, cell.style);
            }
          } else {
            console.log('node geometry change: ' + cell.value);
            let node = cloocaNodes[cell.value];
            console.dir(node);
            if ( node ) {
              if ( node.values.hold ) { // 変更可否
                change.cell.geometry.x = change.previous.x;
                change.cell.geometry.y = change.previous.y;
                change.cell.geometry.width = change.previous.width;
                change.cell.geometry.height = change.previous.height;
                continue;
              }
              let nodeName = cell.value;
              let geometry = change.cell.geometry;
              changeCloocaNodeGeo(cloocaNodes, nodeName, geometry);
            }
          }
        }
      }
      graph.refresh();
    });
    graph.model.addListener(mx.mxEvent.SELECT, function(sender, evt) {
        console.log('mxEvent.SELECT');
        console.dir(sender);
        console.dir(evt);
        evt.consume();
    });

    // 編集確定
    mx.mxEvent.addListener(document, 'keypress', function (evt) {
      if (evt.keyCode == /*enter*/13 &&
          mx.mxEvent.isControlDown(evt)) {
        console.log('Push Ctrl+Enter KEY');
        graph.stopEditing(false);
      }
    });

    let keyHandler = new mx.mxKeyHandler(graph);
    //let compo = new mx.mxGraphComponent(graph);
    keyHandler.bindShiftKey(8, (evt) => { // backspace key
        console.log('Push Shift+BackSpace KEY');
        if (window.isSelectMode) {
           //console.dir(evt);
           graph.panningHandler.useLeftButtonForPanning = true;
        }
    });
    keyHandler.bindKey(13, (evt) => { // Return key
        console.log('Push Return KEY');
        if (window.isSelectMode) {
            let nodeName = new Date().getTime();
            let connName = new Date().getTime()+1;
            let w = defaultNode.width, h = defaultNode.height;
            let style = defaultNode.style;
            let vertex = null;

            if ( selModel.cells.length == 1 ) { //子ノード追加
                let cell = selModel.cells[0];
                console.dir(cell);
                let sourceNode = cloocaNodes[cell.value];
                let targetNode = null;
                let x = (cell.geometry.x + 50), y = (cell.geometry.y + 150);
                addCloocaNode2(nodeName, x, y);
                vertex = graph.insertVertex(parent, null, nodeName, x, y, w, h, style);
                vertexes[nodeName] = vertex;
                let indexes = model.get(nodeCfInfo[defaultNode.name]);
                for ( let i = 0; i < indexes.size(); i++ ){
                    if ( indexes._internal[i].values.name == nodeName ) {
                        targetNode = indexes._internal[i];
                    }
                }
                addCloocaConnection2(connName, sourceNode, targetNode);
                let sourceVertex = vertexes[cell.value];
                let targetVertex = vertexes[nodeName];
                style = defaultConn.style;
                graph.insertEdge(parent, null, connName, sourceVertex, targetVertex, style);

            } else { //ノード追加
                let x = 10, y = 100;
                addCloocaNode2(nodeName, x, y);
                vertex = graph.insertVertex(parent, null, nodeName, x, y, w, h, style);
                vertexes[nodeName] = vertex;
            }

            // 今追加したノードの選択を通知
            let indexNames = [nodeName + ''];
            console.log(indexNames);
            MetaIndexAPI.setSelectedIndexes(indexNames);

            // 今追加したノードを選択状態にする
            setGraphCellSelection(indexNames);

            // 今追加したノードを編集状態にする
            if (vertex) {
              graph.startEditingAtCell(vertex);
            }
        }
    });
    keyHandler.bindKey(189, (evt) => { // [-] key
        console.log('Push [-] KEY');
        graph.zoomOut();
    });
    keyHandler.bindShiftKey(187, (evt) => { // [+] key
        console.log('Push [+] KEY');
        graph.zoomIn();
    });
    keyHandler.bindKey(37, (evt) => { // LEFT key
        console.log('Push LEFT KEY');
        console.log('dump cloocaNodes');
        console.dir(cloocaNodes);
    });
    keyHandler.bindKey(39, (evt) => { // RIGHT key
        console.log('Push RIGHT KEY');
        console.log('dump cloocaConnections');
        console.dir(cloocaConnections);
    });
    keyHandler.bindKey(38, (evt) => { // Up key
        console.log('Push UP KEY');
    });
    keyHandler.bindKey(40, (evt) => { // Down key
        console.log('Push DOWN KEY');
        console.log('dump selModel');
        console.dir(selModel);
    });
    keyHandler.bindKey(9, (evt) => { // tab key
        if (window.isSelectMode) {
            console.log('Push TAB KEY');
            let nm = '-noname-';
            console.dir(selModel);
            if ( selModel.cells.length ) {
              nm = selModel.cells[selModel.cells.length-1].value;
            }
            //console.log(nm);
            selModel.clear();
            let sw = false;
            let flg = false;
            for ( let i in graph.getModel().cells ) {
              if ( sw ) {
                selModel.addCell(graph.getModel().cells[i]);
                graph.setSelectionModel(selModel);
                //console.log(graph.getModel().cells[i].value);
                flg = true;
                break;
              }
              if ( !sw ) {
                if ( graph.getModel().cells[i].value == nm ) {
                  sw = true;
                }
              }
            }
            if ( flg == false ) {
              //console.dir(graph.getModel().cells);
              for ( let i in graph.getModel().cells ) {
                if ( graph.getModel().cells[i].value ) {
                  selModel.addCell(graph.getModel().cells[i]);
                  graph.setSelectionModel(selModel);
                  break;
                }
              }
            }
        }
        graph.refresh();
    });

    let edgeRemove = function(edgename) {
        console.log('edgeRemove(' + edgename + ') called.');
        for (let nodeKey in cloocaNodes) {
	  let node = cloocaNodes[nodeKey];
	  let nodeName = node.values.name;
	  if (!nodeName) continue;
	  let source = cloocaConnections[nodeName];
	  if (!source) continue;
	  let conn = source[edgename];
          if ( conn && !conn.values.hold ) { // エッジの削除
            let src = conn.values.source;
            let dst = conn.values.target;
            if ( src.values.hold == 1 && dst.values.hold == 1) {
	      console.log('EDGE:' + edgename + ' is hold.');
              return false;
            } else {
              let associations = node.get('associations');
	      associations.remove(conn);
              delete cloocaConnections[nodeKey][edgename];
	      // conn.remove();
	      console.log('EDGE:' + edgename + ' is deleted.');
              return true;
            }
          }
        }
        return false;
    }
    keyHandler.bindKey(46, (evt) => { // delete key
        eventFlag = true;
        selModel = graph.getSelectionModel();
        if (window.isSelectMode) {
          console.log('Push DELETE KEY');
          let bf = selModel.cells.length, af = 0;
          console.log('DELETE: count = ' + bf);
          console.dir(selModel);

          let remove_indexes = new Array();
          while ( bf != af ) {
            selModel.cells.forEach(function(cell) {
                let cn = cloocaNodes[cell.value];
                console.dir(cn);
                if ( cn && !cn.values.hold ) { // ノードの削除
                  console.log('ノードの削除');
                  console.dir(cell);
                  ftat_gconnections.forEach(function(conn) {
                    let target = conn.get('target');
                    let targetName = '-none-';
                    if (target) targetName = target.get('name');
                    if (targetName == cell.value) {
                      console.log('関連エッジの削除');
                      console.dir(conn);
                      edgeRemove(conn.values.name);
                    }
                  });
                  remove_indexes.push({name: cell.value + ''});

                  let indexes;
        
                  // 削除したノードが、モデルのどのcontainFeatureに含まれるか探す
                  let isContainedCf = cfNames.some(function (cf) {
                    indexes = model.get(cf);
                    let modelArray = indexes.array().filter(function(eobj, idx) {
                      return eobj.get('name') === cell.value;
                    });
                    return modelArray.length > 0;
                  });

                  if (isContainedCf) {
                    // containFeatureからノードを削除
                    indexes.remove(cloocaNodes[cell.value]);
                  }

                  delete cloocaNodes[cell.value];
                  graphModel.remove(cell);
                  //graph.cellsRemoved(cell);
                  //graph.removeCells(cell, true);
                  console.log('NODE:' + cell.value + ' is deleted.');
                } else if (cell.edge) {
                  console.log('エッジの削除');
                  console.dir(cell);
                  if ( edgeRemove(cell.value) ) graphModel.remove(cell);
                }
            });
            //graph.removeCells(selModel.cells, false);
            //selModel.removeCells(selModel.cells);
            //selModel.clear();
            bf = af;
            af = selModel.cells.length;
          }

          // ノード削除をAPIに通知
          if (remove_indexes.length > 0) {
            Notify_editNode_To_API(remove_indexes, 'remove');

            // 選択中ノードも削除
            MetaIndexAPI.setSelectedIndexes([]);
          }
        }
        graph.refresh();
        //window.location.reload()
        eventFlag = false;
    });
  }

  refresh() {
    console.log('Refresh!!!');

    // 選択モードの場合は範囲選択を有効化
    let rubberband = new this.mx.mxRubberband(this.graph);
    let rubberbandEnabled;
    // if (window.isSelectMode) {
      rubberbandEnabled = true;
    // } else {
    //   rubberbandEnabled = false;
    // }
    rubberband.setEnabled(rubberbandEnabled);

    // 選択モード以外の場合はオブジェクトの移動などを禁止
    let cellsLocked;
    // if (window.isSelectMode) {
      cellsLocked = false;
    // } else {
    //   cellsLocked = true;
    // }
    this.graph.setCellsLocked(cellsLocked);

    // コネクション追加モード向けの設定
    if (window.isAssociationMode) {
      this.mx.mxConnectionHandler.prototype.connectImage = new this.mx.mxImage('/mxgraph/editor-images/connector.gif', 16, 16);
      this.graph.setConnectable(true);
    } else {
      this.graph.setConnectable(false);
    }
  }
}
