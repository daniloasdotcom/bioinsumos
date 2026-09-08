// src/app/components/chat-insumo/chat-insumo.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; // <-- Importamos o HttpClient

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-chat-insumo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-insumo.component.html',
  styleUrls: ['./chat-insumo.component.scss']
})
export class ChatInsumoComponent {
  @Input() insumo!: any; 
  @Output() close = new EventEmitter<void>();

  mensagemAtual: string = '';
  mensagens: ChatMessage[] = [];
  isLoading: boolean = false;

  // Injetamos o HttpClient no construtor
  constructor(private http: HttpClient) {}

  enviarMensagem() {
    if (!this.mensagemAtual.trim()) return;

    const pergunta = this.mensagemAtual;
    this.mensagens.push({ role: 'user', content: pergunta });
    this.mensagemAtual = ''; 
    this.isLoading = true;

    // Chamando o nosso servidor Node.js real
    this.http.post<any>('https://bioinsumos-api.onrender.com/api/chat', {
      pergunta: pergunta,
      produtoNome: this.insumo.nome,
      produtoCultura: this.insumo.cultura,
      produtoAlvo: this.insumo.alvo
    }).subscribe({
      next: (respostaDoServidor) => {
        // Quando a IA responder, adicionamos a resposta no chat
        this.mensagens.push({
          role: 'assistant',
          content: respostaDoServidor.resposta
        });
        this.isLoading = false;
      },
      error: (erro) => {
        console.error('Erro ao chamar o servidor da IA:', erro);
        this.mensagens.push({
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao tentar conectar com a IA. Verifique se o servidor local está rodando e se a chave da API é válida.'
        });
        this.isLoading = false;
      }
    });
  }

  fecharChat() {
    this.close.emit();
  }
}