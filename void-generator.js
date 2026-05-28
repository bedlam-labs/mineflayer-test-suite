'use strict'
const Vec3 = require('vec3').Vec3

module.exports = function ({ version = '1.8.8' } = {}) {
  const registry   = require('prismarine-registry')(version)
  const Chunk      = require('prismarine-chunk')(registry)
  const floorState = registry.blocksByName.bedrock.defaultState

  return function generateChunk () {
    const chunk = new Chunk()
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        chunk.setBlockStateId(new Vec3(x, 0, z), floorState)
      }
    }
    return chunk
  }
}
