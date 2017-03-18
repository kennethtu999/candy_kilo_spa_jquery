var _pageBase = function() {

  this.loading = function($page) {
    var dfd = jQuery.Deferred();

    $(".se-pre-con").fadeIn("slow", function() {
      $('.page').addClass('hide');
      $page.removeClass('hide');
      dfd.resolve();
    });

    return dfd;
  }

  this.loadingComplete = function($page, cb) {
    $('.page').addClass('hide');
    $page.removeClass('hide');
    $(".se-pre-con").fadeOut("slow",cb);
  }

  this.getJSON = function($form, defJson) {
    var data = $form.serializeArray();
    var json = defJson ? defJson : {};
    $(data).each(function() {
      json[this.name] = this.value;
    })
    return json;
  }

  this.dummyPromise = function(data) {
    var dfd = jQuery.Deferred();
    dfd.resolve();
    return dfd;
  }
}

var _pageService = function() {

  this.initLoginPage = function(that) {
    var service = this;
    var $page = $("#page_login");

    service.dummyPromise().then(function() {
      //init view
      $page.find("input").val('');
      $page.find("form").validator('update');

    }).then(function(){
      //binding event
      $page.off('submit').on('submit', function(e) {
        if (!e.isDefaultPrevented()) {
          e.preventDefault();
          service.initOverview(this);
        }
      });
    }).done(function() {
      service.loadingComplete($page);
    });
  }


  this.initOverview = function(that) {
    var service = this;
    var $page = $("#page_overview");

    service.loading($page).then(function() {
      return dataService.findAccounts('all')
    }).then(function(accounts) {
      //init view
      var html = [];
      $(accounts).each(function() {
        html.push(`<tr><td>${this.account}</td><td>${this.balance}</td>`);
        html.push(`<td><a class="btn btn-primary spa_transfer" acn="${this.account}">Transfer</a>`);
        html.push(`<a class="btn btn-info spa_detail" acn="${this.account}">Detail</a></td></tr>`);
      });
      $page.find("tbody").html(html.join('.'));

    }).then(function() {
      //binding event
      $page.find(".spa_transfer").off('click').on('click',function() {
        service.initTransferPage(this);
      })
      $page.find(".spa_detail").off('click').on('click',function() {
        var that = this;
        $(".se-pre-con").fadeIn("slow",function() {
          service.initDetail(that);
        });
      })

    }).done(function() {
      service.loadingComplete($page);
    });
  }


  this.initTransferPage = function(that) {
    var service = this;
    var $page = $("#page_transfer");


    dataService.findAccounts('all').then( function(accounts) {
      //init view
      $page.find('input,select').val('');
      var htmlOut =[];
      var htmlIn =['<option value="">---Select---</option>'];

      $(accounts).each(function() {
        var html = `<option value="${this.account}">${this.account} ${this.dispName} ${this.balance}</option>`;
        this.account == $(that).attr('acn') ? htmlOut.push(html) : htmlIn.push(html);
      });

      $page.find("select[name='outAccount']").html(htmlOut.join(''));
      $page.find("select[name='inAccount']").html(htmlIn.join(''));

      $page.find("form").validator('update');

    }).then(function() {
      //binding event
      $page.off('submit').on('submit', function(e) {
        if (!e.isDefaultPrevented()) {
          e.preventDefault();

          var detail = service.getJSON($page.find('form'), {time : new Date()});
          dataService.transfer(detail);
          service.initOverview();
          $page.modal('hide');
        }
      });
    }).done(function() {
      $page.modal();
    });

  };


  this.initDetail = function(that) {
    var service = this;
    var $page = $("#page_detail");


    service.loading($page).then(function() {
      //loading
      return dataService.findDetails($(that).attr('acn'));

    }).then(function(details) {
      //init view
      var html = [];
      $(details).each(function() {
        var t = moment(this.time).format("YYYY-MM-DD hh:mm:ss");
        html.push(`<tr><td>${t}</td><td>${this.outAccount}</td><td>${this.inAccount}</td><td>${this.amount}</td></tr>`);
      });
      $page.find("tbody").html(html.join('.'));

    }).then(function() {
      //binding event
      $page.off('click').on('click',function() {
        pageService.initOverview(this);
      });

    }).done(function() {
      service.loadingComplete($page);
    });
  };
};

//頁面共用程式提供
_pageService.prototype = new _pageBase();

var pageService = new _pageService();
