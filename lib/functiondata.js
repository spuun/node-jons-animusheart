class FunctionData {
  constructor(data) {
    console.log('FunctionData constructor')
    for (const key in data)
      this[key] = data[key]
  }
  toJSON() {
    return `[${Object.getPrototypeOf(this).constructor.name}]`
  }
}

class AlarmData extends FunctionData {
  constructor(data) {
    super(data)
  }
  toJSON() {
    return `[AlarmData type=${AlarmData.AlarmType[this.type]} event=${AlarmData.AlarmEvents[this.event]} description=${this.description}]`
  }
}
AlarmData.AlarmEvents = {
  '0': 'Inactive',
  '1': 'Maintenance',
  '2': 'Silenced',
  '3': 'Test',
  '4': 'Active',
  '5': 'Unknown'
}
AlarmData.AlarmType = {
  '0': 'Undefined',
  '1': 'Access Control',
  '2': 'Burglar',
  '3': 'Cold',
  '4': 'Gas CO',
  '5': 'Gas CO2',
  '6': 'Heat',
  '7': 'Hardware fail',
  '8': 'Power fail',
  '9': 'Smoke',
  '10':  'Software fail',
  '11':  'Tamper',
  '12':  'Water',
}
class BooleanData extends FunctionData {
  constructor(data) {
    super(data)
  }
  toJSON() {
    return `[BooleanData value=${this.value}]`
  }
}
class CameraData extends FunctionData {
  constructor(data) {
    super(data)
  }
}
class ColorData extends FunctionData {
  constructor(data) {
    super(data)
  }
}
class KeypadData extends FunctionData {
  constructor(data) {
    super(data)
  }
}
class LevelData extends FunctionData {
  constructor(data) {
    super(data)
  }
  toJSON() {
    return `[LevelData level=${this.level} unit=${this.unit}]`
  }
}
class MediaData extends FunctionData {
  constructor(data) {
    super(data)
  }
}
class StringData extends FunctionData {
  constructor(data) {
    super(data)
  }
}
class VolumeData extends FunctionData {
  constructor(data) {
    super(data)
  }
}

module.exports = {
  AlarmData,
  BooleanData,
  CameraData,
  ColorData,
  KeypadData,
  LevelData,
  MediaData,
  StringData,
  VolumeData
}
