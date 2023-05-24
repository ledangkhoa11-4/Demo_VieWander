import express  from "express";
import morgan from "morgan";
import path from 'path';
import { fileURLToPath } from 'url';
import axios from "axios";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express()
const port = 80
const mapQuestKey = `VvlIGiR1ZuvZDNIUbVoxM4aL3wHwcfIc`
app.use(morgan(`dev`))
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`)
})
app.post(`/route`,async (req,res, next)=>{
  let startLoc = removeCityPrefix(req.body.start)
  let endLoc = removeCityPrefix(req.body.end)

  const response = await axios.get(`https://www.mapquestapi.com/directions/v2/route?key=${mapQuestKey}&from=${startLoc}&to=${endLoc}&unit=k`)
  const route = response.data
  if(!route || route.info.statuscode != 0){
    return res.json({
      status: 404,
      message: "We are unable to route with the given locations",
      data: null
    })
  }
  let cityRoute = []
  let queries = ""
  let count = 0
  for(let maneuvers of route.route.legs[0].maneuvers){
    let location = maneuvers.startPoint
    let query = `&location=${location.lat},${location.lng}`
    queries+=query
    count++
    if(count>=99) //api free handle tối đa 100 location
      break
  }
  const cityResponse = await axios.get(`https://www.mapquestapi.com/geocoding/v1/batch?key=${mapQuestKey}${queries}`)
  const cityList = cityResponse.data.results
  for(let city of cityList){
    let cityName = city.locations[0].adminArea4
    if(cityRoute.indexOf(cityName)<0)
      cityRoute.push(cityName)
  }
  route.cityRoute = cityRoute
  console.log(cityRoute)
  res.json(route)
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)  
})

function removeCityPrefix(cityName) {
  const prefixes = ['Tỉnh', 'Thành phố'];
  const pattern = new RegExp('^(' + prefixes.join('|') + ')\\s*', 'i');
  const cleanedName = cityName.replace(pattern, '');
  return cleanedName;
}