(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[405],{7497:function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isInCache=t.createBlock=void 0,t.createBlock=function(e){return{nodes:[],cache:new Set,parent:e}},t.isInCache=function(e,t){let r=t;for(;r;){if(r.cache.has(e))return!0;r=r.parent}return!1}},3349:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r),Object.defineProperty(e,n,{enumerable:!0,get:function(){return t[r]}})}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),a=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0});const i=r(249);t.default=e=>t=>{const r=new i.Transformer(e,t);return e=>r.run(e)},a(r(9814),t)},9814:function(e,t,r){"use strict";var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.Markers=void 0;const a=n(r(4625)),i=r(3826),o=r(9027);function s(e,t,r){if(a.default.isIdentifier(e))return t(e,r);if(a.default.isObjectBindingPattern(e)){const r=[];for(const n of e.elements)r.push(...s(n.name,t,0));return r}if(a.default.isArrayBindingPattern(e)){const r=[];for(const n of e.elements)a.default.isOmittedExpression(n)||r.push(...s(n.name,t,1));return r}return t(e)}t.Markers={Assert:(e,{ctx:t,exp:r,block:n,parameters:c,optional:u})=>{if(1!==t){let t=r;if(!a.default.isIdentifier(t)&&!a.default.isPropertyAccessExpression(t)&&!a.default.isElementAccessExpression(t)){const[e,r]=(0,o.genIdentifier)("temp",t,a.default.NodeFlags.Const);n.nodes.push(e),t=r}return n.nodes.push(...(0,i.validate)(c[0],t,new i.ValidationContext({errorTypeName:c[1]?.symbol?.name,transformer:e,depth:[],propName:-1===t.pos?"value":t.getText()}))),t}n.nodes.push(...s(r,((t,r)=>(0,i.validate)(void 0!==r?e.checker.getTypeAtLocation(t):c[0],t,new i.ValidationContext({errorTypeName:c[1]?.symbol?.name,transformer:e,depth:[],propName:a.default.isIdentifier(t)?t.text:t}),u))))},EarlyReturn:(e,{ctx:t,exp:r,block:n,parameters:c,optional:u})=>{const l=c[1]?e.typeValueToNode(c[1],!0):o.UNDEFINED;if(1!==t){let t=r;if(!a.default.isIdentifier(t)&&!a.default.isPropertyAccessExpression(t)&&!a.default.isElementAccessExpression(t)){const[e,r]=(0,o.genIdentifier)("temp",t,a.default.NodeFlags.Const);n.nodes.push(e),t=r}return n.nodes.push(...(0,i.validate)(c[0],t,new i.ValidationContext({resultType:{return:l},transformer:e,depth:[],propName:-1===t.pos?"value":t.getText()}))),t}n.nodes.push(...s(r,((t,r)=>(0,i.validate)(void 0!==r?e.checker.getTypeAtLocation(t):c[0],t,new i.ValidationContext({resultType:{return:l},transformer:e,depth:[],propName:a.default.isIdentifier(t)?t.text:t}),u))))}}},249:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r),Object.defineProperty(e,n,{enumerable:!0,get:function(){return t[r]}})}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),a=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return a(t,e),t},o=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.Transformer=void 0;const s=o(r(4625)),c=i(r(7497)),u=r(9814),l=r(7914),f=r(9027);t.Transformer=class{constructor(e,t){this.checker=e.getTypeChecker(),this.ctx=t}run(e){if(e.isDeclarationFile)return e;const t=this.visitEach(e.statements);return s.default.factory.updateSourceFile(e,t)}visitEach(e,t=c.createBlock()){for(const r of e){const e=this.visitor(r,t);e&&(Array.isArray(e)?t.nodes.push(...e):t.nodes.push(e))}return t.nodes}visitor(e,t){if(s.default.isFunctionExpression(e)||s.default.isFunctionDeclaration(e)||s.default.isArrowFunction(e)){if(!e.body)return e;const r=c.createBlock(t);for(const t of e.parameters)this.callMarkerFromParameterDecl(t,r);if(s.default.isBlock(e.body))this.visitEach(e.body.statements,r);else{const t=s.default.visitNode(e.body,(e=>this.visitor(e,r)));r.nodes.push(s.default.factory.createReturnStatement(t))}return s.default.isFunctionDeclaration(e)?s.default.factory.createFunctionDeclaration(e.decorators,e.modifiers,e.asteriskToken,e.name,e.typeParameters,e.parameters,e.type,s.default.factory.createBlock(r.nodes,!0)):s.default.isArrowFunction(e)?s.default.factory.createArrowFunction(e.modifiers,e.typeParameters,e.parameters,e.type,e.equalsGreaterThanToken,s.default.factory.createBlock(r.nodes,!0)):s.default.factory.createFunctionExpression(e.modifiers,e.asteriskToken,e.name,e.typeParameters,e.parameters,e.type,s.default.factory.createBlock(r.nodes,!0))}if(s.default.isAsExpression(e)){let r=(0,l.resolveAsChain)(e);const n=this.checker.getSymbolAtLocation(r);if(n){if(c.isInCache(n,t))return e;t.cache.add(n)}r=s.default.visitEachChild(r,(e=>this.visitor(e,t)),this.ctx);const a=this.callMarkerFromAsExpression(e,r,t);return s.default.isExpressionStatement(e.parent)?void 0:a}if(s.default.isBlock(e))return s.default.factory.createBlock(this.visitEach(e.statements,c.createBlock(t)));if(s.default.isCallExpression(e)&&e.arguments[0]){const t=e.expression;if(s.default.isIdentifier(t)&&"is"===t.text){const r=this.checker.getTypeAtLocation(t).getCallSignatures()[0]?.getTypeParameters();if(r&&r[0]&&r[1]&&r[1].getDefault()?.getProperty("__is")){const t=c.createBlock();return u.Markers.EarlyReturn(this,{block:t,parameters:[e.typeArguments?.map((e=>this.checker.getTypeAtLocation(e)))[0]||this.checker.getNullType(),this.checker.getFalseType()],ctx:0,exp:e.arguments[0],optional:!1}),t.nodes.push(s.default.factory.createReturnStatement(s.default.factory.createTrue())),s.default.factory.createImmediatelyInvokedArrowFunction(t.nodes)}}}return s.default.visitEachChild(e,(e=>this.visitor(e,t)),this.ctx)}callMarkerFromParameterDecl(e,t){if(!e.type||!s.default.isTypeReferenceNode(e.type))return;const r=this.resolveActualType(this.checker.getTypeAtLocation(e.type));r&&r.aliasSymbol&&u.Markers[r.aliasSymbol.name]&&u.Markers[r.aliasSymbol.name](this,{block:t,parameters:r.aliasTypeArguments||e.type.typeArguments?.map((e=>this.checker.getTypeAtLocation(e)))||[],ctx:1,exp:e.name,optional:Boolean(e.questionToken)})}callMarkerFromAsExpression(e,t,r){if(!s.default.isTypeReferenceNode(e.type))return e;const n=this.resolveActualType(this.checker.getTypeAtLocation(e.type));return n&&n.aliasSymbol&&u.Markers[n.aliasSymbol.name]&&u.Markers[n.aliasSymbol.name](this,{block:r,parameters:n.aliasTypeArguments||e.type.typeArguments?.map((e=>this.checker.getTypeAtLocation(e)))||[],ctx:0,exp:t})||e}resolveActualType(e){const t=e.getProperty("__marker");if(t&&t.valueDeclaration)return this.checker.getNonNullableType(this.checker.getTypeOfSymbolAtLocation(t,t.valueDeclaration))}getUtilityType(e){const t=e.getProperty("__utility");if(t&&t.valueDeclaration)return this.checker.getNonNullableType(this.checker.getTypeOfSymbolAtLocation(t,t.valueDeclaration))}getStringFromType(e,t){const r=e.aliasTypeArguments?.[t];if(r&&r.isStringLiteral())return r.value}getNodeFromType(e,t){const r=e.aliasTypeArguments?.[t];if(!r)return;const n=this.typeValueToNode(r,!0);return s.default.isIdentifier(n)&&"undefined"===n.text?void 0:n}typeValueToNode(e,t){if(e.isStringLiteral())return s.default.factory.createStringLiteral(e.value);if(e.isNumberLiteral())return s.default.factory.createNumericLiteral(e.value);if((0,l.hasBit)(e,s.default.TypeFlags.BigIntLiteral)){const{value:t}=e;return s.default.factory.createBigIntLiteral(t)}if(e.isUnion()){const r=e.types.map((e=>this.typeValueToNode(e,!0)));return t?r[0]:r}if("false"===e.intrinsicName)return s.default.factory.createFalse();if("true"===e.intrinsicName)return s.default.factory.createTrue();if("null"===e.intrinsicName)return s.default.factory.createNull();{const t=this.getUtilityType(e);if(t&&"Expr"===t.aliasSymbol?.name){const t=this.getStringFromType(e,0);return t?this.stringToNode(t):f.UNDEFINED}return f.UNDEFINED}}stringToNode(e,t){const r=s.default.createSourceFile("expr",e,s.default.ScriptTarget.ESNext,!1,s.default.ScriptKind.JS).statements[0];if(!r||!s.default.isExpressionStatement(r))return f.UNDEFINED;const n=e=>s.default.isIdentifier(e)?t&&t[e.text]?t[e.text]:s.default.factory.createIdentifier(e.text):s.default.visitEachChild(e,n,this.ctx);return s.default.visitNode(r.expression,n)}}},7914:function(e,t,r){"use strict";var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.resolveAsChain=t.isTrueType=t.hasBit=void 0;const a=n(r(4625));t.hasBit=function(e,t){return 0!==(e.flags&t)},t.isTrueType=function(e){return!!e&&"true"===e.intrinsicName},t.resolveAsChain=function(e){for(;a.default.isAsExpression(e);)e=e.expression;return e}},1472:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r),Object.defineProperty(e,n,{enumerable:!0,get:function(){return t[r]}})}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),a=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return a(t,e),t};Object.defineProperty(t,"__esModule",{value:!0}),t.ValidationContext=void 0;const o=i(r(4625)),s=r(9027);t.ValidationContext=class{constructor(e){this.transformer=e.transformer,this.errorTypeName=e.errorTypeName||"Error",this.depth=e.depth,this.resultType=e.resultType||{throw:!0},this.depth.push({propName:e.propName})}error(e,t){if(this.resultType.return)return o.factory.createReturnStatement(this.resultType.return);const r=this.visualizeDepth();return"string"===typeof r?(0,s.genThrow)((0,s.genNew)(this.errorTypeName,t?.[0]||"Expected "+r+(t?.[1]||` to be ${this.transformer.checker.typeToString(e)}.`))):(0,s.genThrow)((0,s.genNew)(this.errorTypeName,[(0,s.genAdd)((0,s.genAdd)((0,s.genStr)(t?.[0]||"Expected "),r),(0,s.genStr)(t?.[1]||` to be ${this.transformer.checker.typeToString(e)}.`))]))}addPath(e,t){this.depth.push({parent:e,propName:t})}removePath(){this.depth.pop()}genOptional(e,t){return(0,s.genLogicalAND)(this.exists(e),t)}exists(e){const t=this.depth[this.depth.length-1];return t.parent&&"string"===typeof t.propName?o.factory.createBinaryExpression((0,s.genStr)(t.propName),o.default.SyntaxKind.InKeyword,t.parent):(0,s.genCmp)(e,s.UNDEFINED)}visualizeDepth(){const e=[];let t;for(const r of this.depth)"string"===typeof r.propName?e.push(r.propName):t?e.length?(t=(0,s.genAdd)((0,s.genAdd)(t,(0,s.genStr)(`]${e.join(".")}[`)),r.propName),e.length=0):t=(0,s.genAdd)((0,s.genAdd)(t,(0,s.genStr)("][")),r.propName):e.length?(t=(0,s.genAdd)((0,s.genStr)(`${e.join(".")}[`),r.propName),e.length=0):t=r.propName;return t?e.length?(0,s.genAdd)(t,(0,s.genStr)(`]${e.join(".")}`)):(0,s.genAdd)(t,(0,s.genStr)("]")):e.join(".")}}},3826:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r),Object.defineProperty(e,n,{enumerable:!0,get:function(){return t[r]}})}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),a=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return a(t,e),t};Object.defineProperty(t,"__esModule",{value:!0}),t.ValidationContext=t.isNoCheck=t.isTupleType=t.isArrayType=t.validate=t.validateType=t.validateBaseType=void 0;const o=i(r(4625)),s=r(9027),c=r(7914),u=r(1472);Object.defineProperty(t,"ValidationContext",{enumerable:!0,get:function(){return u.ValidationContext}});const l=Symbol("NoCheck");function f(e,t,r){if(t.isStringLiteral())return(0,s.genCmp)(r,o.factory.createStringLiteral(t.value));if(t.isNumberLiteral())return(0,s.genCmp)(r,o.factory.createNumericLiteral(t.value));if((0,c.hasBit)(t,o.TypeFlags.String))return(0,s.genTypeCmp)(r,"string");if((0,c.hasBit)(t,o.TypeFlags.BigInt))return(0,s.genTypeCmp)(r,"bigint");if((0,c.hasBit)(t,o.TypeFlags.Number))return(0,s.genTypeCmp)(r,"number");if((0,c.hasBit)(t,o.TypeFlags.Boolean))return(0,s.genTypeCmp)(r,"boolean");if((0,c.hasBit)(t,o.TypeFlags.ESSymbol))return(0,s.genTypeCmp)(r,"symbol");if((0,c.hasBit)(t,o.TypeFlags.Null))return(0,s.genCmp)(r,o.factory.createNull());if((0,c.hasBit)(t,o.TypeFlags.Any)||(0,c.hasBit)(t,o.TypeFlags.Unknown))return l;if(1===t.getCallSignatures().length)return(0,s.genTypeCmp)(r,"function");if(t.isClass())return(0,s.genNot)((0,s.genInstanceof)(r,t.symbol.name));{const n=e.transformer.getUtilityType(t);if(!n||!n.aliasSymbol||!n.aliasTypeArguments)return;switch(n.aliasSymbol.name){case"Range":{const t=e.transformer.getNodeFromType(n,0),a=e.transformer.getNodeFromType(n,1),i=[];return t&&i.push(o.factory.createLessThan(r,t)),a&&i.push(o.factory.createGreaterThan(r,a)),i.length?(0,s.genLogicalOR)((0,s.genTypeCmp)(r,"number"),(0,s.genLogicalOR)(...i)):(0,s.genTypeCmp)(r,"number")}case"Matches":{const t=e.transformer.getNodeFromType(n,0);return t?(0,s.genLogicalOR)((0,s.genTypeCmp)(r,"string"),(0,s.genNot)(o.factory.createCallExpression((0,s.genPropAccess)(o.default.isStringLiteral(t)?o.factory.createRegularExpressionLiteral(t.text):t,"test"),void 0,[r]))):(0,s.genTypeCmp)(r,"string")}case"NoCheck":return l}}}function d(e,t,r){let n;if(n=f(r,e,t)){if(n===l)return;return{condition:()=>n,error:()=>r.error(e)}}if(e.isUnion())return{condition:()=>{let n,a=!1;const i=[];for(const u of e.types)if((0,c.hasBit)(u,o.TypeFlags.Undefined))n=!0;else if(g(r.transformer.checker,u)||y(r.transformer.checker,u)){if(a)continue;i.push((0,s.genNot)((0,s.genInstanceof)(t,"Array"))),a=!0}else{const e=d(u,t,r);e&&i.push(e.condition())}return n?r.genOptional(t,(0,s.genLogicalAND)(...i)):(0,s.genLogicalAND)(...i)},error:()=>r.error(e)};if(n=y(r.transformer.checker,e))return{condition:()=>(0,s.genNot)((0,s.genInstanceof)(t,"Array")),error:()=>r.error(e),other:h(r,n)?void 0:()=>{const e=o.factory.createUniqueName("i"),[a,i]=(0,s.genIdentifier)("x",o.factory.createElementAccessExpression(t,e),o.default.NodeFlags.Const);r.addPath(i,e);const c=p(n,i,r);return r.removePath(),[(0,s.genForLoop)(t,e,[a,...c])[0]]}};if(n=g(r.transformer.checker,e))return{condition:()=>(0,s.genNot)((0,s.genInstanceof)(t,"Array")),error:()=>r.error(e),other:()=>{const e=[];for(let a=0;a<n.length;a++){const i=o.factory.createElementAccessExpression(t,a);r.addPath(i,o.factory.createNumericLiteral(a)),e.push(...p(n[a],i,r,!1)),r.removePath()}return e}};{const n=r.transformer.getUtilityType(e);switch(n?.aliasSymbol?.name){case"ExactProps":{const e=n.aliasTypeArguments?.[0];if(!e)return;const a=d(e,t,r);if(!a||!a.other)return;return{...a,other:()=>{const i=o.factory.createUniqueName("name");r.addPath(t,i);const c=r.error(n,["Property "," is excessive."]);return r.removePath(),[...a.other(),(0,s.genForInLoop)(t,i,[(0,s.genIf)((0,s.genLogicalAND)(...e.getProperties().map((e=>(0,s.genCmp)(i,(0,s.genStr)(e.name))))),c)])[0]]}}}case"If":{if(!n.aliasTypeArguments)return;const e=n.aliasTypeArguments[0],a=r.transformer.getStringFromType(n,1),i=(0,c.isTrueType)(n.aliasTypeArguments[2]);if(!e||!a)return;const o=i?d(e,t,r):void 0,u=()=>(0,s.genNegate)(r.transformer.stringToNode(a,{$self:t})),l=()=>r.error(n,[void 0,` to satisfy \`${a}\`.`]);return{condition:o?o.condition:u,error:o?o.error:l,other:o?()=>o.other?[...o.other(),(0,s.genIf)(u(),l())]:[(0,s.genIf)(u(),l())]:void 0}}default:return{other:()=>{const n=e.getProperties(),a=[];for(const i of n){if(i===e.aliasSymbol)continue;const n=o.factory.createElementAccessExpression(t,(0,s.genStr)(i.name));r.addPath(t,i.name);const c=r.transformer.checker.getTypeOfSymbol(i)||r.transformer.checker.getNullType();c===c.getNonNullableType()?a.push(...p(c,n,r,!1)):a.push(...p(c.getNonNullableType(),n,r,!0)),r.removePath()}return a},condition:()=>(0,s.genTypeCmp)(t,"object"),error:()=>r.error(e)}}}}function p(e,t,r,n){const a=d(e,t,r);if(!a)return[];const{condition:i,error:o,other:c}=a;if(n)return c?[(0,s.genIf)(r.exists(t),[(0,s.genIf)(i(),o()),...c()])]:[(0,s.genIf)(r.genOptional(t,i()),o())];{const e=[(0,s.genIf)(i(),o())];return c&&e.push(...c()),e}}function y(e,t){const r=e.typeToTypeNode(t,void 0,void 0);if(r)return r.kind===o.default.SyntaxKind.ArrayType?e.getTypeArguments(t)[0]:void 0}function g(e,t){const r=e.typeToTypeNode(t,void 0,void 0);if(r)return r.kind===o.default.SyntaxKind.TupleType?e.getTypeArguments(t):void 0}function h(e,t){const r=e.transformer.getUtilityType(t);return!(!r||!r.aliasSymbol||"NoCheck"!==r.aliasSymbol.name)}t.validateBaseType=f,t.validateType=d,t.validate=p,t.isArrayType=y,t.isTupleType=g,t.isNoCheck=h},9027:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r),Object.defineProperty(e,n,{enumerable:!0,get:function(){return t[r]}})}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),a=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return a(t,e),t};Object.defineProperty(t,"__esModule",{value:!0}),t.UNDEFINED=t.genNegate=t.genIdentifier=t.genStmt=t.genNum=t.genStr=t.genAdd=t.genNot=t.genForInLoop=t.genForLoop=t.genPropAccess=t.genInstanceof=t.genNew=t.genThrow=t.genLogicalAND=t.genLogicalOR=t.genBinaryChain=t.genTypeCmp=t.genCmp=t.genIfElseChain=t.genIf=void 0;const o=i(r(4625));function s(e,t,r){if(!(e>=t.length))return o.factory.createIfStatement(t[e][0],l(t[e][1]),s(e+1,t,r)||r)}function c(e,t){if(1===t.length)return t[0];let r=o.factory.createBinaryExpression(t[0],e,t[1]);for(let n=2;n<t.length;n++)r=o.factory.createBinaryExpression(r,e,t[n]);return r}function u(e){return o.factory.createPrefixUnaryExpression(o.default.SyntaxKind.ExclamationToken,e)}function l(e){return Array.isArray(e)?o.factory.createBlock(e.map(l),!0):e.kind>o.default.SyntaxKind.EmptyStatement&&e.kind<o.default.SyntaxKind.DebuggerStatement?e:o.factory.createExpressionStatement(e)}function f(e,t,r=o.default.NodeFlags.Let){const n="string"===typeof e?o.factory.createUniqueName(e):e;return[o.factory.createVariableStatement(void 0,o.factory.createVariableDeclarationList([o.factory.createVariableDeclaration(n,void 0,void 0,t)],r)),n]}t.genIf=function(e,t,r){return o.factory.createIfStatement(e,l(t),r&&l(r))},t.genIfElseChain=function(e,t){return s(0,e,t?l(t):void 0)},t.genCmp=function(e,t,r=!0){return o.factory.createBinaryExpression(e,r?o.default.SyntaxKind.ExclamationEqualsEqualsToken:o.default.SyntaxKind.EqualsEqualsEqualsToken,t)},t.genTypeCmp=function(e,t,r=!0){return o.factory.createBinaryExpression(o.factory.createTypeOfExpression(e),r?o.default.SyntaxKind.ExclamationEqualsEqualsToken:o.default.SyntaxKind.EqualsEqualsEqualsToken,o.factory.createStringLiteral(t))},t.genBinaryChain=c,t.genLogicalOR=function(...e){return c(o.default.SyntaxKind.BarBarToken,e)},t.genLogicalAND=function(...e){return c(o.default.SyntaxKind.AmpersandAmpersandToken,e)},t.genThrow=function(e){return o.factory.createThrowStatement(e)},t.genNew=function(e,t){return o.factory.createNewExpression(o.factory.createIdentifier(e),void 0,"string"===typeof t?[o.factory.createStringLiteral(t)]:t)},t.genInstanceof=function(e,t){return o.factory.createBinaryExpression(e,o.default.SyntaxKind.InstanceOfKeyword,"string"===typeof t?o.factory.createIdentifier(t):t)},t.genPropAccess=function(e,t){return"string"===typeof t?o.factory.createPropertyAccessExpression(e,t):o.factory.createElementAccessExpression(e,t)},t.genForLoop=function(e,t,r){const[n,a]=f(t,o.factory.createNumericLiteral(0));return[o.factory.createForStatement(n.declarationList,o.factory.createBinaryExpression(a,o.default.SyntaxKind.LessThanToken,o.factory.createPropertyAccessExpression(e,"length")),o.factory.createPostfixIncrement(a),l(r)),a]},t.genForInLoop=function(e,t,r){const[n,a]=f(t);return[o.factory.createForInStatement(n.declarationList,e,l(r)),a]},t.genNot=u,t.genAdd=function(e,t){return o.factory.createAdd(e,t)},t.genStr=function(e){return o.factory.createStringLiteral(e)},t.genNum=function(e){return o.factory.createNumericLiteral(e)},t.genStmt=l,t.genIdentifier=f,t.genNegate=function(e){if(o.default.isBinaryExpression(e))switch(e.operatorToken.kind){case o.default.SyntaxKind.EqualsEqualsToken:return o.factory.createBinaryExpression(e.left,o.default.SyntaxKind.ExclamationEqualsToken,e.right);case o.default.SyntaxKind.ExclamationEqualsToken:return o.factory.createBinaryExpression(e.left,o.default.SyntaxKind.EqualsEqualsToken,e.right);case o.default.SyntaxKind.EqualsEqualsEqualsToken:return o.factory.createBinaryExpression(e.left,o.default.SyntaxKind.ExclamationEqualsEqualsToken,e.right);case o.default.SyntaxKind.ExclamationEqualsEqualsToken:return o.factory.createBinaryExpression(e.left,o.default.SyntaxKind.EqualsEqualsEqualsToken,e.right);case o.default.SyntaxKind.GreaterThanToken:return o.factory.createBinaryExpression(e.left,o.default.SyntaxKind.LessThanToken,e.right);case o.default.SyntaxKind.GreaterThanEqualsToken:return o.factory.createBinaryExpression(e.left,o.default.SyntaxKind.LessThanEqualsToken,e.right);case o.default.SyntaxKind.LessThanToken:return o.factory.createBinaryExpression(e.left,o.default.SyntaxKind.GreaterThanToken,e.right);case o.default.SyntaxKind.LessThanEqualsToken:return o.factory.createBinaryExpression(e.left,o.default.SyntaxKind.GreaterThanEqualsToken,e.right)}else if(o.default.isPrefixUnaryExpression(e)&&e.operator===o.default.SyntaxKind.ExclamationToken)return e.operand;return u(e)},t.UNDEFINED=o.factory.createIdentifier("undefined")},3841:function(e){function t(e){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=function(){return[]},t.resolve=t,t.id=3841,e.exports=t},5301:function(e,t,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/",function(){return r(2028)}])},2028:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return S}});var n=r(5893),a=r(5423),i=r.n(a),o=r(3349),s=r.n(o);function c(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}var u='\ntype Assert<T, ErrorType = Error> = T & { __marker?: Assert<T, ErrorType> };\ntype EarlyReturn<T, ReturnValue = undefined> = T & { __marker?: EarlyReturn<T, ReturnValue> };\ntype Range<min extends number|Expr<"">, max extends number|Expr<"">> = number & { __utility?: Range<min, max> }; \ntype NoCheck<T> = T & { __utility?: NoCheck<T> };\ntype Matches<Regex extends string|Expr<"">> = string & { __utility?: Matches<Regex> };\ntype ExactProps<Obj extends object> = Obj & { __utility?: ExactProps<Obj> };\ntype Expr<Expression extends string> = { __utility?: Expr<Expression> };\ntype If<Type, Expression extends string, FullCheck extends boolean = false> = Type & { __utility?: If<Type, Expression, FullCheck> };\ndeclare function is<T, _M = { __is: true }>(prop: unknown) : prop is T;\n\n',l=function(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{},n=Object.keys(r);"function"===typeof Object.getOwnPropertySymbols&&(n=n.concat(Object.getOwnPropertySymbols(r).filter((function(e){return Object.getOwnPropertyDescriptor(r,e).enumerable})))),n.forEach((function(t){c(e,t,r[t])}))}return e}({},i().getDefaultCompilerOptions(),{strict:!0,noImplicitAny:!0,strictNullChecks:!0,target:i().ScriptTarget.ESNext});function f(e){var t=i().createSourceFile("module.ts",u+e,l.target||i().ScriptTarget.ESNext,!0),r="",n={getSourceFile:function(){return t},writeFile:function(e,t){return r=t},getDefaultLibFileName:function(){return""},useCaseSensitiveFileNames:function(){return!1},getCanonicalFileName:function(e){return e},getCurrentDirectory:function(){return""},getNewLine:function(){return"\n"},fileExists:function(){return!0},readFile:function(){return""},directoryExists:function(){return!0},getDirectories:function(){return[]}},a=i().createProgram(["module.ts"],l,n);window.checker=a.getTypeChecker(),window.source=t;try{a.emit(void 0,void 0,void 0,void 0,{before:[s()(a)]})}catch(o){return{error:o}}return{code:r}}var d=r(7294),p=r(9604);function y(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function g(e){var t=(0,p.Ik)();return(0,d.useEffect)((function(){if(t){t.languages.typescript.javascriptDefaults.setCompilerOptions(function(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{},n=Object.keys(r);"function"===typeof Object.getOwnPropertySymbols&&(n=n.concat(Object.getOwnPropertySymbols(r).filter((function(e){return Object.getOwnPropertyDescriptor(r,e).enumerable})))),n.forEach((function(t){y(e,t,r[t])}))}return e}({},l));var e="ts:ts-runtime-checks/index.d.ts";t.languages.typescript.javascriptDefaults.addExtraLib(u,e),t.editor.createModel(u,"typescript",t.Uri.parse(e))}}),[t]),(0,n.jsx)(p.ZP,{height:"calc(90vh - 50px)",language:"typescript",theme:"vs-dark",value:e.code,onChange:e.onChange})}var h=r(4051),m=r.n(h);function T(e,t,r,n,a,i,o){try{var s=e[i](o),c=s.value}catch(u){return void r(u)}s.done?t(c):Promise.resolve(c).then(n,a)}function x(e){var t=(0,d.useState)(),r=t[0],a=t[1],i=(0,p.Ik)();return(0,d.useEffect)((function(){var t;i&&(t=m().mark((function t(){var r;return m().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,i.editor.colorize(e.text,"javascript",{tabSize:4});case 2:r=t.sent,a(r);case 4:case"end":return t.stop()}}),t)})),function(){var e=this,r=arguments;return new Promise((function(n,a){var i=t.apply(e,r);function o(e){T(i,n,a,o,s,"next",e)}function s(e){T(i,n,a,o,s,"throw",e)}o(void 0)}))})()}),[i,e.text]),(0,n.jsx)("div",{children:r&&(0,n.jsx)("div",{dangerouslySetInnerHTML:{__html:r},style:{backgroundColor:"#1e1e1e",overflowY:"auto",paddingLeft:"15px",height:"calc(90vh - 50px)",fontFamily:"monospace",overflowX:"hidden"}})})}var v=r(5884),E=r(6961),b=r(8836),N=r.n(b),k="\n// Interactive playground! Write in your code and see it getting transpiled on the left!\ninterface User {\n    name: string,\n    id: number\n}\n\nfunction validate(user: Assert<User>) {\n    // Your code...\n}\n";function S(){var e=(0,d.useState)(k),t=e[0],r=e[1],a=(0,d.useState)(""),i=a[0],o=a[1];return(0,d.useEffect)((function(){var e=Object.fromEntries(new URLSearchParams(window.location.search).entries());if(e.code){var t=(0,E.decompressFromEncodedURIComponent)(e.code);if(!t)return;r(t);var n=f(t),a=n.code,i=n.error;o(a||""+i)}else o(f(k).code)}),[]),(0,n.jsxs)("div",{children:[(0,n.jsxs)("header",{className:N().header,children:[(0,n.jsxs)("div",{style:{display:"flex"},children:[(0,n.jsx)("h2",{children:"Typescript runtime checks"}),(0,n.jsx)("button",{className:N().copyLink,onClick:function(){t&&navigator.permissions.query({name:"clipboard-write"}).then((function(e){"granted"!=e.state&&"prompt"!=e.state||navigator.clipboard.writeText(location.origin+location.pathname+"?code=".concat((0,E.compressToEncodedURIComponent)(t)))}))},children:"Copy Link"})]}),(0,n.jsx)("a",{href:"https://github.com/GoogleFeud/ts-runtime-checks",style:{fontSize:"24px"},children:(0,n.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"28",height:"28",fill:"currentColor",viewBox:"0 0 16 16",children:(0,n.jsx)("path",{d:"M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"})})})]}),(0,n.jsxs)(v.Z,{split:"vertical",defaultSize:"50%",primary:"first",children:[(0,n.jsx)(g,{code:t,onChange:function(e){r(e);var t=f(e||""),n=t.code,a=t.error;o(n||""+a)}}),(0,n.jsx)("div",{children:(0,n.jsx)(x,{text:i})})]}),(0,n.jsx)("footer",{className:N().footer,children:(0,n.jsxs)("p",{children:["Made with \u2764\ufe0f by ",(0,n.jsx)("a",{href:"https://github.com/GoogleFeud",children:"GoogleFeud"}),"."]})})]})}},8836:function(e){e.exports={header:"App_header__3xFa8",footer:"App_footer__qJi0F",copyLink:"App_copyLink__OTIWX"}},3411:function(e){function t(e){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=function(){return[]},t.resolve=t,t.id=3411,e.exports=t},7424:function(){},9107:function(){},444:function(){},6170:function(){},1157:function(){},1638:function(){},1206:function(){},2183:function(){},3024:function(){},2715:function(){},3611:function(){},8353:function(){},1210:function(){},1480:function(){}},function(e){e.O(0,[138,21,371,774,888,179],(function(){return t=5301,e(e.s=t);var t}));var t=e.O();_N_E=t}]);