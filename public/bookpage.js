var time;
function val(e) {
  var time = document.getElementById(e.id).value;
  //   console.log(time);
  console.log("hello");
  return t(time);
}
function t(time) {
  document.getElementById("d").innerHTML = time;
  document.getElementById("t").value = time;
}
