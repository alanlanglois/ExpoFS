import { FileSystem } from 'expo';

let options = {
  storagePath: `${FileSystem.documentDirectory}appData`,
  encoding: 'utf8',
  toFileName: (name: string) => name.split(':').join('-'),
  fromFileName: (name: string) => name.split('-').join(':'),
}

const pathForKey = (key: string) => `${options.storagePath}/${options.toFileName(key)}`
const FilesystemStorage = {
  config: (
    customOptions: Object,
  ) => {
    options = {
      ...options,
      ...customOptions,
    }
  },

  setItem: (
    key: string,
    value: string,
    callback?: (error: ?Error) => void,
  ) =>
    FileSystem.makeDirectoryAsync( options.storagePath, {intermediates: true,} )
      .then(( success ) => {
        FileSystem.writeAsStringAsync(pathForKey(key), value)
          .then(() => {
            console.log("fs:::: setItem " + key)
            callback && callback()
          })
          .catch(error => {
            console.log("error" + error)
            callback && callback(error)
          })
      })
      .catch(err => {
        console.log("fs :: error : " + err)
      }),



  getItem: (
    key: string,
    callback: (error: ?Error, result: ?string) => void
  ) =>
    FileSystem.readAsStringAsync(pathForKey(options.toFileName(key)), options.encoding)
      .then(data => {
        callback && callback(null, data)
        if (!callback) return data
      })
      .catch(error => {
        callback && callback(error)
        if (!callback) throw error
      }),

  removeItem: (
    key: string,
    callback: (error: ?Error) => void,
  ) =>
    FileSystem.deleteAsync(pathForKey(options.toFileName(key)))
      .then(() => callback && callback())
      .catch(error => {
        callback && callback(error)
        if (!callback) throw error
      }),

  getAllKeys: (
    callback: (error: ?Error, keys: ?Array<string>) => void,
  ) =>
    FileSystem.getInfoAsync(options.storagePath)
    .then(exists =>
      exists ? true : FileSystem.makeDirectoryAsync( options.storagePath, {intermediates: true,} )
    )
    .then(() =>
      FileSystem.readDirectoryAsync(options.storagePath)
        .then(files => files.map(file => options.fromFileName(file)))
        .then(files => {
          callback && callback(null, files)
          if (!callback) return files
        })
    )
    .catch(error => {
      callback && callback(error)
      if (!callback) throw error
    }),
}

FilesystemStorage.clear = (
  callback: (error: ?Error) => void,
) =>
  FilesystemStorage.getAllKeys((error, keys) => {
    if (error) throw error

    if (Array.isArray(keys) && keys.length) {
      keys.forEach(key => {
        FilesystemStorage.removeItem(key)
      })

      callback && callback(null, true)
      return true
    }

    callback && callback(null, false)
    return false
  }).catch(error => {
    callback && callback(error)
    if (!callback) throw error
  })

export default FilesystemStorage
