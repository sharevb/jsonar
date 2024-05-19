/* eslint-disable quotes */
/* eslint-disable guard-for-in */

const escapeQuotes = require('escape-quotes')
const isPlainObject = require('lodash.isplainobject')
const isEmpty = require('lodash.isempty')
const PhpParser = require('php-parser')

const escapeString = value => {
  value = escapeQuotes(value)
  value = value.replace(/\n/g, "\\n")
  value = value.replace(/"/g, "\\\"")
  return value
}

const phpParser = new PhpParser({
  parser: {
    locations: false,
    extractDoc: true,
  },
})

const phpLexer = {
  L_PARENTHESIS: '(',
  R_PARENTHESIS: ')',
  ARRAY_POINTER: '=>',
  ARRAY_KEYWORD: 'array',
  NULL_KEYWORD: 'null',
  EMPTY_KEYWORD: "''",
  COMMA: ',',
}

const indentTypes = {
  SPACE: ' ',
  TAB: '\t',
}

const quoteTypes = {
  SINGLE: "'",
  DOUBLE: '"',
}

const isString = string_ => typeof string_ === 'string'

const isArray = array => typeof array === 'object' && Array.isArray(array)

const isJSON = json => {
  try {
    return JSON.parse(json)
  } catch (_) {
    return false
  }
}

const literal = string => ({
  ___$isLiteral: true,
  ___$string: string,
})

const arrify = (object, options, treeLevel = 1) => {
  const tree = treeLevel < 0 ? 0 : treeLevel
  const result = []
  const hasIndent = options.indent > 0
  const indentChar = options.space ? indentTypes.SPACE : indentTypes.TAB
  let objectSize = typeof object === 'object' && object !== null ? Object.keys(object).length : 0

  const addTabTo = (array, treeCount) => {
    if (hasIndent) {
      const indentChars = []
      for (let i = 0; i < options.indent * treeCount; i++) {
        indentChars.push(indentChar)
      }

      array.push(indentChars.join(''))
    }
  }

  const addNewLineTo = array => {
    if (hasIndent) {
      array.push('\n')
    }
  }

  const addSpaceTo = array => {
    if (hasIndent) {
      array.push(' ')
    }
  }

  if (isPlainObject(object) && object.___$isLiteral) {
    return object.___$string
  }

  if (isPlainObject(object)) {
    result.push(phpLexer.ARRAY_KEYWORD, phpLexer.L_PARENTHESIS)

    if (Object.keys(object).length > 0) {
      addNewLineTo(result)
    }

    let index = 0
    for (const key in object) {
      if (Object.hasOwn(object, key)) {
        const arrayKey = options.quote + escapeString(key) + options.quote
        const arrayValue = object[key]
        addTabTo(result, tree)
        result.push(arrayKey)
        addSpaceTo(result)
        result.push(phpLexer.ARRAY_POINTER)
        addSpaceTo(result)
        result.push(arrify(arrayValue, options, tree + 1))
        index++
      }

      if ((index < objectSize && options.trailingComma === false) || options.trailingComma) {
        result.push(phpLexer.COMMA)
      }

      if (index < objectSize) {
        addNewLineTo(result)
      }
    }

    if (Object.keys(object).length > 0) {
      addNewLineTo(result)
      addTabTo(result, tree - 1)
    }

    result.push(phpLexer.R_PARENTHESIS)
    return result.join('')
  }

  if (isArray(object)) {
    objectSize = object.length - 1
    result.push(phpLexer.ARRAY_KEYWORD, phpLexer.L_PARENTHESIS)

    for (const [index, item] of object.entries()) {
      addNewLineTo(result)
      addTabTo(result, tree)

      result.push(arrify(item, options, tree + 1))

      if ((index < objectSize && options.trailingComma === false) || options.trailingComma) {
        result.push(phpLexer.COMMA)
      }

      if (index === objectSize) {
        addNewLineTo(result)
        addTabTo(result, tree - 1)
      }
    }

    result.push(phpLexer.R_PARENTHESIS)

    return result.join('')
  }

  if (isString(object)) {
    return options.quote + escapeString(object) + options.quote
  }

  if ((!object || objectSize === 0) && isPlainObject(object)) {
    result.push(phpLexer.ARRAY_KEYWORD, phpLexer.L_PARENTHESIS, phpLexer.R_PARENTHESIS)
    return result.join('')
  }

  if (object === null) {
    result.push(phpLexer.NULL_KEYWORD)
    return result.join(null)
  }

  if (Number.isNaN(object)) {
    result.push(phpLexer.EMPTY_KEYWORD)
    return result.join('')
  }

  return object
}

const applyEmptyRules = (object, emptyRules) => {
  for (const key in object) {
    if (Object.hasOwn(object, key) && key in emptyRules) {
      object[key] = isEmpty(object[key]) ? emptyRules[key] : Object.assign(object[key], applyEmptyRules(object[key], emptyRules[key]))
    }
  }

  return object
}

exports.quoteTypes = quoteTypes

exports.arrify = (json, options) => {
  const defaultOptions = Object.assign({}, {
    prettify: false,
    indent: 1,
    space: false,
    trailingComma: false,
    quote: quoteTypes.DOUBLE,
  })
  options = Object.assign(defaultOptions, options)
  options.indent = (options.prettify === false) ? 0 : options.indent

  const validJSON = isJSON(json)
  let object = validJSON || {}
  object = isPlainObject(json) ? json : object

  const phpArray = arrify(object, options)
  return `${phpArray};`
}

exports.parse = (codes, options = {}) => {
  options = Object.assign({
    asObject: true,
    emptyRules: {},
  }, options)

  const AST = phpParser.parseEval(codes)
  const iterator = items => {
    const normalizeValue = item => {
      let mapItems = []
      let callArguments = ''

      switch (item.value.kind) {
        case 'number': {
          return Number.parseInt(item.value.value, 10)
        }

        case 'array': {
          if (item.value.items.length === 0) {
            return []
          }

          return iterator(item.value.items)
        }

        case 'call': {
          mapItems = item.value.arguments.map(item => {
            switch (item.kind) {
              case 'string': {
                return quoteTypes.SINGLE + item.value + quoteTypes.SINGLE
              }

              case 'boolean': {
                return JSON.parse(item.value)
              }

              case 'number': {
                return Number.parseInt(item.value, 10)
              }

              default: {
                return item.value
              }
            }
          })

          callArguments = mapItems.length > 0 ? ` ${mapItems.join(', ')} ` : ''
          return literal(`${item.value.what.name}(${callArguments})`)
        }

        case 'string': {
          return item.value.value
        }

        case 'boolean': {
          return JSON.parse(item.value.value)
        }

        default: {
          return JSON.stringify(item.value.value)
        }
      }
    }

    const json = {}
    let arry = []

    for (const item of items) {
      if (item.key) {
        json[item.key.value] = normalizeValue(item)
      } else {
        arry = arry.concat(normalizeValue(item))
      }
    }

    if (arry.length > 0) {
      return arry
    }

    return json
  }

  let object = {}

  if (AST.kind === 'program') {
    object = iterator(AST.children[0].items)
    object = applyEmptyRules(object, options.emptyRules)
  }

  if (options.asObject === false) {
    object = JSON.stringify(object)
  }

  return object
}

exports.literal = literal
