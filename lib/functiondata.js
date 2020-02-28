class FunctionData {
  constructor(data) {
    for (const key in data)
      this[key] = data[key]
  }
}

class AlarmData extends FunctionData {
  constructor(data) {
    super(data)
  }
}
class BooleanData extends FunctionData {
  constructor(data) {
    super(data)
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
