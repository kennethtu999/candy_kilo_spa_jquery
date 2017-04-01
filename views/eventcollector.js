"use strict";

$(function() {

  /**
   * BDD測試資案例與資料產生程式
   * 一般只需修改這裡就可以讓產出案例符合專案使用方式
   */
  var _bddService = function() {
    /**
     * 取得預設檔位名稱
     */
    var getDisplayName = function(actionData) {
      if (actionData.action == 'url' ) {
        return null;

      } else if (actionData.action == 'paging') {
        return $(actionData.html).text();

      } else if (actionData.action == 'input') {
        var $curr = $(actionData.html);
        var $parent = $(actionData.parentHtml);
        if ($curr.prop('placeholder') != null) {
          return $curr.prop('placeholder').replace(/\s/g,'');
        } else if ($parent.find('label').length != 0) {
            return $parent.find('label').text();
        } else {
          console.debug('can not find displayName: ' + actionData.html)
          return $(actionData.parentHtml).text();
        }
      }
    }

    /**
     * 產生feature內容
     */
    var buildFeature = function(actionData, displayName) {
      if (actionData.action == 'pagestart') {
        return `When 進入 "${actionData.value}" 頁面`;

      } else if (actionData.action == 'url') {
        return `When 開始測試網站 ${actionData.value}`;

      } else if (actionData.action == 'paging') {
        return `Then 按下 "${displayName}" 送出頁面`;

      } else if (/[(<input)]+.*/.test(actionData.html)) {
        return `When 輸入 "${displayName}" "${actionData.value}"`;

      } else if (/[(<select)]+.*/.test(actionData.html)) {
        return `When form下拉選單選擇 "${displayName}" "${actionData.value}"`;

      } else {
        return `When 輸入  "${displayName}" "${actionData.value}"`;
      }
    }

    /**
     * 產生JSON內容
     */
    var buildJSON = function(actionData, page) {
      var displayName = getDisplayName(actionData);
      if (displayName != null) {
        page[displayName] = actionData.cssSelector;
      }
      return displayName;
    }

    /**
     * 取得動作與動作間的思考時間
     */
    var getWaitingTime = function(actions, index) {
      return (index == 0 ) ? null : Math.ceil((actions[index].time - actions[index-1].time) / 1000)
    }

    /**
     * 產生完整的自動化測試用資料(feature with json data)
     */
    this.generate = function(actions) {
      var json = {};
      var feature = [];

      var page = {};
      var pageIndex =1;
      var pageName = 'page' + pageIndex;
      json[pageName] = page;

      $.each(actions, function(index,actionData) {
        //console.log('process' + JSON.stringify(actionData,null,2));
        var waiting = getWaitingTime(actions, index);
        if (waiting != null) {
          feature.push(`When 等待 "${waiting}" 秒`);
        }

        var actionKey = buildJSON(actionData, page);
        feature.push(buildFeature(actionData, actionKey));
        if (actionData.action == 'paging' || actionData.action == 'url') {
          if (actionData.action == 'paging') {
            pageName = 'page' + ++pageIndex;
            page = {};
            json[pageName] = page;
          }
          feature.push(buildFeature({action:'pagestart', value: pageName}));
        }
      });

      //add empty line
      var featureStr = [];
      $.each(feature,function(i,obj) {
        if (/When 進入.*頁面/.test(obj)) {
          featureStr.push('');
        }
        featureStr.push(obj);
      })

      return {featureData : json, feature: featureStr.join('\n\t')};
    }
  }

  var _actionService = function() {
    var actions = [];

    var _getCssSelector = function($e) {
      var s = [];

      //TagName
      s.push($e.prop('tagName'));

      //Unique ID
      if ($e.attr('id')) {
        s.push('#');
        s.push($e.attr('id'));
      }

      //CSS Classes
      if ($e.attr('class')) {
        $.each($e.attr('class').split('\s+'), function() {
          if (this != 'hide') {
            s.push('.');
            s.push(this);
          }
        });
      }

      //Useful tag
      var attrAry = [];
      $.each($e[0].attributes, function() {
        if(this.specified) {
          if (this.name == 'name' || this.name.startsWith('data-bind') ) {
            attrAry.push(this.name + "='" + this.value + "'");
          }
        }
      });
      if (attrAry.length > 0) {
        s.push('[');
        s.push(attrAry.join(','));
        s.push(']');
      }

      return s.join('');
    }

    var _genHtml = function($e) {
      return $("<div />").append($e.clone()).html().replace(/\s+/g,' ');
    }

    var _genValue = function($e) {
      var tagName = $e.prop('tagName');
      if (tagName == 'INPUT') {
        return $e.val();
      } else if (tagName == 'SELECT') {
        return $e.find('option:selected').text();
      } else {
        return null;
      }
    }

    var _genAction = function(action, $e, extraParams) {
      var rtn = { time: new Date(), action: action, cssSelector: '', value: '', html: '', parentHtml: ''}

      if ($e != null) {
        $.extend(rtn, {
          cssSelector: _getCssSelector($e),
          value: _genValue($e),
          html : _genHtml($e),
          parentHtml: _genHtml($e.parent())
        });
      }

      if (extraParams) {
        $.extend(rtn, extraParams);
      }

      return rtn;
    }

    /**
     * 新增操作行為，如果與前一個操作在同一個位置，則視為做同一件事，只更新其資料
     */
    var _addAction = function(action) {
      if (actions.length > 0 && actions[actions.length-1].cssSelector == action.cssSelector) {
        actions[actions.length-1].value = action.value;
      } else {
        actions.push(action);
      }
    }

    this.saveAction = function(actionType, $e) {
      var action = null;
      if (actionType == 'url') {
        action = _genAction(actionType, null, {value : window.location.href});
      } else {
        action = _genAction(actionType, $e, null);
      }
      _addAction(action);
    }

    this.getActions = function() {
      return actions;
    }

  }

  var _eventService = function() {
    var map = {'Shift':false, 'Control':false, 'e':false, 'g':false};
    this.handleCommand = function(e) {
      if (!map.hasOwnProperty(e.key)) {
        return;
      }

      map[e.key] = e.type == 'keydown' ? true : false;

      //Ctrl + e : 複制所在位置元素的內容，供比對用
      if (map['Control'] && map['e']) {
        var ary = document.querySelectorAll( ":hover" );
        this.actionService.saveAction('select', $(ary[ary.length-1]));
      }

      //Ctrl + g : 錄制結束時產出BDD feature and json 檔
      if (map['Control'] && map['g']) {
        var ary = document.querySelectorAll( ":hover" );
        var rtn = this.bddService.generate(this.actionService.getActions());

        console.log(JSON.stringify(rtn.featureData,null,2));
        console.log(rtn.feature);
      }
    }


    var _isCollectable = function($e) {
      var idx = $.inArray($e.prop('tagName'), ['INPUT','SELECT','BUTTON', 'A', 'DIV', 'SPAN', 'LI']);

      if (idx != -1 && !$e.hasClass('disabled')) {
        return true;
      } else {
        return false;
      }
    }

    this.handleEvent = function(e) {
      var $e = $(e.target);
      //Shift + Mouse click : 用來指出是在進行換頁動作
      if (map['Shift'] && e.type == 'click') {
        this.actionService.saveAction('paging', $e);

      //單純錄製 輸入 / 選擇 / 點擊 行為
      } else if (_isCollectable($e)) {
        this.actionService.saveAction('input', $e);
      }
    }
  }


  //服務初始化與建立彼此間的關係
  var actionIns = new _actionService();
  var bddIns = new _bddService();
  var eventService = new _eventService();
  eventService.actionService = actionIns;
  eventService.bddService = bddIns;

  actionIns.saveAction('url',null);

  //開始監聽頁面上的操作行為
  var e1 = function(e) { eventService.handleEvent(e)}
  document.addEventListener("blur", e1,true);
  document.addEventListener("click", e1,true);
  var e2 = function(e) { eventService.handleCommand(e)}
  document.addEventListener("keydown", e2);
  document.addEventListener("keyup", e2);

});
