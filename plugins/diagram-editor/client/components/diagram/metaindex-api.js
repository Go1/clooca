let superagent = require('superagent');

let MetaIndexAPI = function() {
}

MetaIndexAPI.postIndexes = function(indexNames, onFail) {
  let url = 'http://localhost:4567/indexes';
  let param = new Array();
  for (let nameIdx = 0; nameIdx < indexNames.length; nameIdx++) {
    let name = indexNames[nameIdx];
    let index = {
      'name': name
    }
    console.log(index);
    param.push(index);
  }
  console.log(param);
  superagent
    .post(url)
    .send(param)
    .end((err, res) => {
      if (err) {
        console.warn(err);
        onFail();
        return;
      }
      console.log(res);
      if (res) {
        let resBody = res.body;
        console.log(resBody);
        let resText = res.text;
        console.log(resText);
      }
    });
};

MetaIndexAPI.editIndexes = function(indexes, onFail, mode) {
  let url = 'http://localhost:4567/indexes/edit/' + mode;
  console.log('editIndexes',indexes);
  superagent
    .post(url)
    .send(indexes)
    .end((err, res) => {
      if (err) {
        console.warn(err);
        onFail();
        return;
      }
      console.log(res);
      if (res) {
        let resBody = res.body;
        console.log(resBody);
        let resText = res.text;
        console.log(resText);
      }
    });
};

MetaIndexAPI.getSelectedIndexes = function(onSuccess, onFail) {
  let url = 'http://localhost:4567/selected_indexes';
  superagent
    .get(url)
    .end((err, res) => {
      if (err) {
        console.warn(err);
        onFail();
        return;
      }
      console.log(res);
      if (!res) {
        return;
      }
      let resText = res.text;
      console.log(resText);
      let resTextObj = JSON.parse(resText);
      console.log(resTextObj);
      if (!resTextObj) {
        return;
      }
      onSuccess(resTextObj);
    });
}

MetaIndexAPI.setSelectedIndexes = function(indexNames, onFail) {
  console.log('setSelectedIndexes', indexNames);
  if (!indexNames) {
    console.warn('indexNames is empty');
    return;
  }
  let url = 'http://localhost:4567/indexes/select';
  let param = {
    'selected_indexes': indexNames
  }
  console.log(param);
  superagent
    .post(url)
    .send(param)
    .end((err, res) => {
      if (err) {
        console.warn(err);
        onFail();
        return;
      }
      console.log(res);
      if (!res) {
        return;
      }
      let resBody = res.body;
      console.log(resBody);
      let resText = res.text;
      console.log(resText);
    });
}

let _post = function(url, param, onSuccess, onFail) {
  console.log(url, param, onSuccess);
  superagent
    .post(url)
    .send(param)
    .end((err, res) => {
      if (err) {
        console.warn(err);
        onFail();
        return;
      }
      console.log(res);
      if (!res) {
        onSuccess('');
        return;
      }
      let resBody = res.body;
      console.log(resBody);
      let resText = res.text;
      console.log(resText);
      if (!resText) {
        onSuccess('');
        return;
      }
      let resTextObj = JSON.parse(resText);
      if (!resTextObj) {
        onSuccess('');
        return;
      }
      onSuccess(resTextObj);
    });
}

MetaIndexAPI.postModel = function(model, onSuccess, onFail) {
  let url = 'http://localhost:4567/models';
  console.log(model);
  if (!model) return;
  let param = model;
  _post(url, param, onSuccess, onFail);
}

MetaIndexAPI.getCommand = function(onSuccess, onFail) {
  let url = 'http://localhost:4567/command';
  superagent
    .get(url)
    .end((err, res) => {
      if (err) {
        console.warn(err);
        onFail();
        return;
      }
      console.log(res);
      if (!res) {
        return;
      }
      let resText = res.text;
      console.log(resText);
      let resTextObj = JSON.parse(resText);
      console.log(resTextObj);
      if (!resTextObj) {
        return;
      }
      onSuccess(resTextObj);
    });
}

module.exports = MetaIndexAPI;