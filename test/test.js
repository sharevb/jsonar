const {readFile} = require('node:fs')
const path = require('node:path')
const test = require('ava')
const jsonar = require('../index.js')

const exampleFile = path.join(__dirname, 'example.json')
const jsonFile = () => new Promise(resolve => {
  readFile(exampleFile, 'ascii', (error, data) => {
    if (error) {
      throw new Error(error)
      }

      resolve(data)
    })
  })

test('undefined param is blank array', t => {
  t.is(jsonar.arrify(), 'array();')
})

test('json is valid PHP array (minified)', async t => {
  await jsonFile().then(result => {
    t.is(jsonar.arrify(result), 'array("emptyarr"=>array(),"emptyobj"=>array(),"greetings"=>"Hello","answers"=>42,"inception"=>array("nested"=>array("object"=>true),"array"=>array("string",true,100,array("inception"=>true))),"playlist"=>array(array("id"=>"DHyUYg8X31c","desc"=>"Do Robots Deserve Rights? What if Machines Become Conscious?"),array("id"=>"ijFm6DxNVyI","desc"=>"The Most Efficient Way to Destroy the Universe - False Vacuum")));')
  })
})

test('json is valid PHP array (prettify)', async t => {
  await jsonFile().then(result => {
    t.is(jsonar.arrify(result, {prettify: true}), 'array(\n\t"emptyarr" => array(),\n\t"emptyobj" => array(),\n\t"greetings" => "Hello",\n\t"answers" => 42,\n\t"inception" => array(\n\t\t"nested" => array(\n\t\t\t"object" => true\n\t\t),\n\t\t"array" => array(\n\t\t\t"string",\n\t\t\ttrue,\n\t\t\t100,\n\t\t\tarray(\n\t\t\t\t"inception" => true\n\t\t\t)\n\t\t)\n\t),\n\t"playlist" => array(\n\t\tarray(\n\t\t\t"id" => "DHyUYg8X31c",\n\t\t\t"desc" => "Do Robots Deserve Rights? What if Machines Become Conscious?"\n\t\t),\n\t\tarray(\n\t\t\t"id" => "ijFm6DxNVyI",\n\t\t\t"desc" => "The Most Efficient Way to Destroy the Universe - False Vacuum"\n\t\t)\n\t)\n);')
  })
})

test('json is valid PHP array (prettify) with single quote', async t => {
  await jsonFile().then(result => {
    /* eslint-disable quotes */
    t.is(jsonar.arrify(result, {prettify: true, quote: jsonar.quoteTypes.SINGLE}), "array(\n\t'emptyarr' => array(),\n\t'emptyobj' => array(),\n\t'greetings' => 'Hello',\n\t'answers' => 42,\n\t'inception' => array(\n\t\t'nested' => array(\n\t\t\t'object' => true\n\t\t),\n\t\t'array' => array(\n\t\t\t'string',\n\t\t\ttrue,\n\t\t\t100,\n\t\t\tarray(\n\t\t\t\t'inception' => true\n\t\t\t)\n\t\t)\n\t),\n\t'playlist' => array(\n\t\tarray(\n\t\t\t'id' => 'DHyUYg8X31c',\n\t\t\t'desc' => 'Do Robots Deserve Rights? What if Machines Become Conscious?'\n\t\t),\n\t\tarray(\n\t\t\t'id' => 'ijFm6DxNVyI',\n\t\t\t'desc' => 'The Most Efficient Way to Destroy the Universe - False Vacuum'\n\t\t)\n\t)\n);")
    /* eslint-enable */
  })
})

test('json is valid PHP array (prettify) with trailing comma', async t => {
  await jsonFile().then(result => {
    /* eslint-disable quotes */
    t.is(jsonar.arrify(result, {prettify: true, quote: jsonar.quoteTypes.SINGLE, trailingComma: true}), "array(\n\t'emptyarr' => array(),\n\t'emptyobj' => array(),\n\t'greetings' => 'Hello',\n\t'answers' => 42,\n\t'inception' => array(\n\t\t'nested' => array(\n\t\t\t'object' => true,\n\t\t),\n\t\t'array' => array(\n\t\t\t'string',\n\t\t\ttrue,\n\t\t\t100,\n\t\t\tarray(\n\t\t\t\t'inception' => true,\n\t\t\t),\n\t\t),\n\t),\n\t'playlist' => array(\n\t\tarray(\n\t\t\t'id' => 'DHyUYg8X31c',\n\t\t\t'desc' => 'Do Robots Deserve Rights? What if Machines Become Conscious?',\n\t\t),\n\t\tarray(\n\t\t\t'id' => 'ijFm6DxNVyI',\n\t\t\t'desc' => 'The Most Efficient Way to Destroy the Universe - False Vacuum',\n\t\t),\n\t),\n);")
    /* eslint-enable */
  })
})

test('json is valid PHP array (prettify) 4 indentation with space', async t => {
  await jsonFile().then(result => {
    t.is(jsonar.arrify(result, {prettify: true, indent: 4, space: true}), 'array(\n    "emptyarr" => array(),\n    "emptyobj" => array(),\n    "greetings" => "Hello",\n    "answers" => 42,\n    "inception" => array(\n        "nested" => array(\n            "object" => true\n        ),\n        "array" => array(\n            "string",\n            true,\n            100,\n            array(\n                "inception" => true\n            )\n        )\n    ),\n    "playlist" => array(\n        array(\n            "id" => "DHyUYg8X31c",\n            "desc" => "Do Robots Deserve Rights? What if Machines Become Conscious?"\n        ),\n        array(\n            "id" => "ijFm6DxNVyI",\n            "desc" => "The Most Efficient Way to Destroy the Universe - False Vacuum"\n        )\n    )\n);')
  })
})

test('js object to PHP array', t => {
  const object = {
    universe: 'expanding',
    galaxy: jsonar.literal('__php_fn("andromeda")'),
  }
  t.is(jsonar.arrify(object), 'array("universe"=>"expanding","galaxy"=>__php_fn("andromeda"));')
})

test('parsing object should be valid', async t => {
  await jsonFile().then(result => {
    const phpArray = jsonar.arrify(result)
    t.deepEqual(jsonar.parse(phpArray, {
      emptyRules: {
        emptyobj: {},
      },
    }), JSON.parse(result))
  })
})

test('parsing object with empty item in nested array should be valid', async t => {
  await jsonFile().then(result => {
    result = JSON.parse(result)
    result.inception.nested.emptyarr = []
    result.inception.nested.emptyobj = {}

    const phpArray = jsonar.arrify(result)
    const parsed = jsonar.parse(phpArray, {
      emptyRules: {
        emptyobj: {},
        inception: {
          nested: {
            emptyobj: {},
          },
        },
      },
    })

    t.deepEqual(parsed, result)
  })
})
