const {readFileSync} = require('node:fs')
const path = require('node:path')
const jsonar = require('../index.js')

const exampleFile = path.join(__dirname, 'example.json')
const json = readFileSync(exampleFile, 'ascii')

const output = jsonar.arrify(json, {prettify: true, quote: jsonar.quoteTypes.SINGLE})
console.log(output)

const secondJson = Object.assign({}, JSON.parse(json))
secondJson.fn = jsonar.literal('__( \'Hello World\' , \'text-domain\', true, 10 )')

const secondOutput = jsonar.arrify(secondJson, {prettify: true, quote: jsonar.quoteTypes.SINGLE})
console.log(secondOutput)
console.log('parsing', JSON.stringify(jsonar.parse(secondOutput), null, 2))

