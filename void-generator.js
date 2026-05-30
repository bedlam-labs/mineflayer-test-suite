'use strict'
const Vec3 = require('vec3').Vec3

module.exports = function ({ version = '1.8.8' } = {}) {
  const registry   = require('prismarine-registry')(version)
  const Chunk      = require('prismarine-chunk')(registry)
  const floorState = registry.blocksByName.bedrock.defaultState

  return function generateChunk (chunkX, chunkZ) {
    const chunk = new Chunk()
    if (chunkX < 1 && chunkZ < 1 && chunkX >= -1 && chunkZ >= -1) {
      chunk.setBlockStateId(new Vec3(Math.floor(chunkX / 16), 0, Math.floor(chunkZ / 16)), floorState)
    }
    
    return chunk
  }
}
