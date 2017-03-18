var dataService = new function() {
    //帳號資料
    var data = [
      {account : 'acn0001', dispName: 'Salary', balance:50000},
      {account : 'acn0002', dispName: 'Investment', balance:200000},
      {account : 'acn0003', dispName: 'Home', balance:30000}
    ];

    //交易資料
    var details = [];

    this.findAccounts = function(accountNo) {
      var dfd = jQuery.Deferred();
      setTimeout(function() {
        dfd.resolve(data);
      },100);
      return dfd;
    }

    this.findDetails = function(accountNo) {
      var dfd = jQuery.Deferred();

      setTimeout(function() {
        var rtn = [];
        $(details).each(function() {
          if (this.outAccount == accountNo) {
            rtn.push(this);
          }
        })
        dfd.resolve(rtn);
      },100);

      return dfd;
    }

    this.transfer = function(detail) {
      var dfd = jQuery.Deferred();

      setTimeout(function() {
        $(data).each(function() {
          if (this.account == detail.outAccount) {
            this.balance -= parseInt(detail.amount,10);
          } else if (this.account == detail.inAccount) {
            this.balance += parseInt(detail.amount,10);
          }
        });
        details.push(detail);

        dfd.resolve(detail);
    },100);
      return dfd;
    }
};
