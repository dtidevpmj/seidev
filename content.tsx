import type { PlasmoCSConfig } from "plasmo"
import React from "react"
import { createRoot } from "react-dom/client"

import ModalComponent from "./components/modal"

export const config: PlasmoCSConfig = {
  matches: ["https://sei-docs-implementacao.jaru.ro.gov.br/sei/*"],
  all_frames: true
}

// Variável global para armazenar o CPF
let userCpf: string | null = null

export default function init() {
  const iframe = document.querySelector(
    "#divConteudo > #divIframeVisualizacao > div > #ifrConteudoVisualizacao"
  ) as HTMLIFrameElement | null

  if (!iframe) {
    return
  }

  iframe.addEventListener("load", () => {
    const iframeDocument = iframe.contentDocument

    if (!iframeDocument) {
      console.error("Documento do iframe não encontrado")
      return
    }

    const container = iframeDocument.querySelector("#divArvoreAcoes")

    if (container) {
      if (!iframeDocument.querySelector("#openModal")) {
        container.insertAdjacentHTML(
          "beforeend",
          `<a href="#" id="openModal">
            <img src="https://cdn-icons-png.flaticon.com/512/4732/4732392.png" alt="Abrir Modal">
          </a>`
        )

        const openModalLink = iframeDocument.querySelector("#openModal")

        if (openModalLink) {
          openModalLink.addEventListener("click", (event) => {
            event.preventDefault()
            openModal(iframeDocument)
          })
        }
      }
    } else {
      console.error("Container não encontrado")
    }

    // Capturando o nome do usuário
    const userElement = document.querySelector(
      "#lnkUsuarioSistema"
    ) as HTMLElement
    if (userElement) {
      const userTitle = userElement.title
      const userName = userTitle.match(/\(([^)]+)\)/)?.[1].split("/")[0]

      // Fazendo a requisição à API
      const url = `https://api-usr-controller.jaru.ro.gov.br/user/cpf/${userName}`
      fetch(url)
        .then((response) => response.text())
        .then((data) => {
          // Supondo que a resposta é o CPF diretamente
          userCpf = data.trim() // Remove espaços extras, se houver
        })
        .catch((error) =>
          console.error("Erro ao fazer a requisição à API:", error)
        )
    } else {
      console.error("Elemento do usuário não encontrado")
    }
  })
}

function openModal(iframeDocument: Document) {
  const existingModal = iframeDocument.querySelector("#customModal")
  if (existingModal) {
    existingModal.remove()
  }

  const modalContainer = iframeDocument.createElement("div")
  modalContainer.id = "customModal"
  iframeDocument.body.appendChild(modalContainer)

  const root = createRoot(modalContainer)
  // Passe a variável userCpf para o ModalComponent
  root.render(<ModalComponent iframeDocument={iframeDocument} cpf={userCpf} />)
}

init()
