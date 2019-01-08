import { fakeWeather, rainSpeed, snowSpeed, callUrl } from "../params";

export enum Weather {
    sun,
    clouds,
    rain,
    heavyRain,
    snow,
    storm
  }


  @Component('currentWeather')
export class CurrentWeather {
  weather: Weather
  dropsToAdd: number
  flakesToAdd: number
  spawnInterval: number
  currentSpawnInterval: number
  checkInterval: number = 0
  lightningCounter: number = 10
  clouds: Entity
  house: Entity
  constructor(
    weather: Weather = Weather.sun,
    dropsToAdd: number = 0,
    flakesToAdd: number = 0,
    interval: number = 100,
    currentInterval: number = 0
  ) {
    this.weather = weather
    this.dropsToAdd = dropsToAdd
    this.flakesToAdd = flakesToAdd
    this.spawnInterval = interval
    this.currentSpawnInterval = interval
  }
}

export class CheckWeather implements ISystem {
  weather: CurrentWeather
  constructor(weather){
      this.weather = weather
  }
  update(dt: number) {
    this.weather.checkInterval -= 1
    if (this.weather.checkInterval < 0) {
      getWeather(this.weather)
      this.weather.checkInterval = 100000
    }
  }
}


export class LightningSystem implements ISystem {
  weather: CurrentWeather
  lightning: Entity
  lightningModels: GLTFShape[]
  constructor(weather, lightning, models){
      this.weather = weather
      this.lightning = lightning
      this.lightningModels = models
  }
  update() {
    if (this.weather.weather == Weather.storm) {
      this.weather.lightningCounter -= 1
      //log("timer " + timer.count)
      if (this.weather.lightningCounter < 0) {
        let lightningNum: number = Math.floor(Math.random() * 25) + 1
        if (lightningNum > 6) {
          if (this.lightning.has(GLTFShape)) {
            this.lightning.remove(GLTFShape)
            this.weather.lightningCounter = Math.random() * 20
            return
          }
        }

        this.lightning.set(this.lightningModels[lightningNum])
        this.weather.lightningCounter = Math.random() * 10
      }
    }
  }
}

function getWeather(weather: CurrentWeather) {
  let newWeather: Weather = Weather.sun
  if (fakeWeather) {
    newWeather = mapWeather(fakeWeather)
    setWeather(weather, newWeather)
  } else {
    executeTask(async () => {
      try {
        log('getting new weather')
        let response = await fetch(callUrl)
        let json = await response.json()
        newWeather = mapWeather(json.wx_desc)
        setWeather(weather, newWeather)
      } catch {
        log('failed to reach URL', error)
      }
    })
  }
}

function mapWeather(weather: string) {
  log(weather)
  let simpleWeather: Weather
  if (weather.match(/(thunder)/gi)) {
    simpleWeather = Weather.storm
  } else if (weather.match(/(snow|ice)/gi)) {
    simpleWeather = Weather.snow
  } else if (weather.match(/(heavy|torrential)/gi)) {
    simpleWeather = Weather.heavyRain
  } else if (weather.match(/(rain|drizzle|shower)/gi)) {
    simpleWeather = Weather.rain
  } else if (weather.match(/(cloud|cloudy|overcast|fog|mist)/gi)) {
    simpleWeather = Weather.clouds
  } else {
    simpleWeather = Weather.sun
  }
  return simpleWeather
}

function setWeather(current: CurrentWeather, newWeather: Weather) {
  if (newWeather == current.weather) {
    return
  }
  current.weather = newWeather
  switch (current.weather) {
    case Weather.storm:
      current.dropsToAdd = 100
      current.flakesToAdd = 0
      current.spawnInterval = rainSpeed / current.dropsToAdd
      break
    case Weather.snow:
      current.dropsToAdd = 0
      current.flakesToAdd = 50
      current.spawnInterval = (snowSpeed * 10) / current.flakesToAdd
      break
    case Weather.heavyRain:
      current.dropsToAdd = 50
      current.flakesToAdd = 0
      current.spawnInterval = rainSpeed / current.dropsToAdd
      break
    case Weather.rain:
      current.dropsToAdd = 10
      current.flakesToAdd = 0
      current.spawnInterval = rainSpeed / current.dropsToAdd //(10/(0.033*rainSpeed)*30 ) /weather.dropsToAdd
      break
    case Weather.clouds:
      current.dropsToAdd = 0
      current.flakesToAdd = 0
      break
    case Weather.sun:
      current.dropsToAdd = 0
      current.flakesToAdd = 0
      break
  }
  setHouse(current)
  setClouds(current)
}

export function setClouds(weather: CurrentWeather) {
  let clouds = weather.clouds
  switch (weather.weather) {
    case Weather.storm:
      clouds.set(new GLTFShape('models/dark-cloud.gltf'))
      break
    case Weather.snow:
      clouds.set(new GLTFShape('models/dark-cloud.gltf'))
      break
    case Weather.heavyRain:
      clouds.set(new GLTFShape('models/dark-cloud.gltf'))
      break
    case Weather.rain:
      clouds.set(new GLTFShape('models/clouds.gltf'))
      break
    case Weather.clouds:
      clouds.set(new GLTFShape('models/clouds.gltf'))
      break
    case Weather.sun:
      clouds.remove(GLTFShape)
      break
  }
}

export function setHouse(weather: CurrentWeather) {
  let house = weather.house
  switch (weather.weather) {
    case Weather.storm:
      house.set(new GLTFShape('models/house_wet.gltf'))
      break
    case Weather.snow:
      house.set(new GLTFShape('models/house_snow.gltf'))
      break
    case Weather.heavyRain:
      house.set(new GLTFShape('models/house_wet.gltf'))
      break
    case Weather.rain:
      house.set(new GLTFShape('models/house_wet.gltf'))
      break
  }
}