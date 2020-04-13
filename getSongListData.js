//get data from html
names = [...document.querySelector("#playlist_wrapper > table > tbody").rows].map((e) => {
  if (e.cells[2]) return e.cells[2].innerText;
}).filter((e) => e);
ids = [...document.querySelector("#playlist_wrapper > table > tbody").rows].map((e) => {
  if (e.cells[3]) return e.cells[3].children[0].pathname.split("request(")[1].split(");")[0];
}).filter((e) => e);
pictures = [...document.querySelector("#playlist_wrapper > table > tbody").rows].map((e) => {
  if (e.cells[1]) return e.cells[1].children[0].children[0].src;
}).filter((e) => e);
albums = [...document.querySelector("#playlist_wrapper > table > tbody").rows].map((e) => {
  if (e.cells[4]) return e.cells[4].innerText !== "" ? e.cells[4].innerText : "No Album";
}).filter((e) => e !== undefined);
times = [...document.querySelector("#playlist_wrapper > table > tbody").rows].map((e) => {
  if (e.cells[5]) return e.cells[5].innerText !== "" ? e.cells[5].innerText : "? ? ?";
}).filter((e) => e !== undefined);

data = new Array(names.length)

for (let i = 0; i < names.length; i++) {
  data[i] = {
    name: names[i],
    id: ids[i],
    pictureUrl: pictures[i],
    album: albums[i],
    songLength: times[i]
  }
}


