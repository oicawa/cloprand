define(function (require) { 
  function Inherits(Child, Parent) {
    //Object.setPrototypeOf(Child.prototype, Parent.prototype);
    Child.prototype = Object.create(Parent.prototype);
  };
  return Inherits;
});
