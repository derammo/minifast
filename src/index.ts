import fastify, {
  FastifyBaseLogger,
  FastifyInstance,
  FastifyTypeProviderDefault,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault
} from 'fastify';

import Ajv, { AnySchemaObject, SchemaObjCxt } from 'ajv';

import { DataValidateFunction } from 'ajv/dist/types';
import { FastifyRouteSchemaDef } from 'fastify/types/schema';

type Fastify = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  FastifyBaseLogger,
  FastifyTypeProviderDefault
>;

const ajvDefaults = {
  removeAdditional: true,
  coerceTypes: true,
  allErrors: true
};

const standardValidator = new Ajv(ajvDefaults);

function compileToAcceptAll(
  _schema: any,
  _parentSchema: AnySchemaObject,
  _it: SchemaObjCxt
): DataValidateFunction {
  return (_data: any) => true;
}

const extendedValidator = new Ajv(ajvDefaults).addKeyword({
  keyword: 'cli_item_name',
  type: 'array',
  compile: compileToAcceptAll
});

function validatorCompiler(routeSchemaDef: FastifyRouteSchemaDef<object>) {
  const compiler =
    routeSchemaDef.httpPart == 'body' ? extendedValidator : standardValidator;
  return compiler.compile(routeSchemaDef.schema);
}

const server: Fastify = fastify({
  logger: true
});

server.setValidatorCompiler(validatorCompiler);

const exampleListSchema = {
  type: 'array',
  $id: '#example_list',
  cli_item_name: 'example',
  items: {
    type: 'object',
    $id: '#example_item'
  }
} as const;

if (process.argv[2] == 'fail') {
  server.addSchema(exampleListSchema.items);
}

server.post('/test', { schema: { body: exampleListSchema }, handler: (request, reply) => {
  console.log(`yo ${request.body}!`);
}});

server.listen({ port: 3000 }, (err: any, address: any) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  console.log(`running on ${address}`);
});