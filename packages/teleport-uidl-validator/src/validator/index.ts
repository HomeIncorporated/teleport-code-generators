import {
  ProjectUIDL,
  ComponentUIDL,
  ProjectValidationError,
  ComponentValidationError,
} from '@teleporthq/teleport-types'
import { componentUIDLValidator, projectUIDLValidator } from '../decoders'
import { VComponentUIDL, VProjectUIDL } from '../decoders/types'
import * as utils from './utils'

interface ValidationResult {
  valid: boolean
  errorMsg: string
  componentUIDL?: VComponentUIDL
  projectUIDL?: VProjectUIDL
}

export default class Validator {
  public validateComponentSchema(input: unknown): ValidationResult {
    try {
      const cleanedUIDL = componentUIDLValidator.runWithException(input)
      return { valid: true, errorMsg: '', componentUIDL: cleanedUIDL }
    } catch (e) {
      const errorMsg = utils.formatErrors([{ kind: e.kind, message: e.message, at: e.at }])
      throw new ComponentValidationError(errorMsg)
    }
  }

  public validateProjectSchema(input: Record<string, unknown>): ValidationResult {
    try {
      const cleanedUIDL = projectUIDLValidator.runWithException(input)
      return { valid: true, errorMsg: '', projectUIDL: cleanedUIDL }
    } catch (e) {
      const errorMsg = utils.formatErrors([{ kind: e.kind, message: e.message, at: e.at }])
      throw new ComponentValidationError(errorMsg)
    }
  }

  public validateComponentContent(input: ComponentUIDL): ValidationResult {
    const errorsInDefinitions = utils.checkDynamicDefinitions(
      (input as unknown) as Record<string, unknown>
    )
    const errorsWithLocalVariables = utils.checkForLocalVariables(input)

    utils.checkForDuplicateDefinitions(input)
    const errors = [...errorsInDefinitions, ...errorsWithLocalVariables]

    if (errors.length > 0) {
      throw new ComponentValidationError(
        `UIDL Component Content Validation Error. Please check the following: \n${errors}`
      )
    }

    return { valid: true, errorMsg: '' }
  }

  public validateProjectContent(input: ProjectUIDL): ValidationResult {
    const errorsOnRouteNode = utils.checkRouteDefinition(input) || []
    let allErrors = errorsOnRouteNode

    if (errorsOnRouteNode.length === 0) {
      const errorsInStyleSet = utils.checkProjectStyleSet(input)
      const errorsInRootComponent = utils.checkRootComponent(input)

      const errorsWithComponentNaming = utils.checkComponentNaming(input)
      const errorsWtihComponentExistence = utils.checkComponentExistence(input)

      allErrors = [
        ...errorsOnRouteNode,
        ...errorsWtihComponentExistence,
        ...errorsWithComponentNaming,
        ...errorsInRootComponent,
        ...errorsInStyleSet,
      ]
    }

    if (allErrors.length > 0) {
      throw new ProjectValidationError(
        `UIDL Project Content Validation Error. Please check the following: ${allErrors}`
      )
    }

    return { valid: true, errorMsg: '' }
  }
}
