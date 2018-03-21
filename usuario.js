var Certificado = require("./certificado.js");

class Usuario {

  constructor(nome){
    this.nome = nome;
    this.certificados = [];
    this.totalCertificados = 0;
  }

  adicionarCertificado(certificado){
    this.certificados.push(certificado);
  }

  calcularTotalDeCertificados(){
    this.totalCertificados = this.certificados.length;
  }

};

module.exports = Usuario;
