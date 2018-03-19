var Certificado = require("./certificado.js");

class Usuario {

  constructor(nome){
    this.nome = nome;
    this.certificados = [];
  }

  adicionarCertificado(certificado){
    this.certificados.push(certificado);
  }

};

module.exports = Usuario;
