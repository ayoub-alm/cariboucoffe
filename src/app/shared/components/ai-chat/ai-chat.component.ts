import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
    timestamp: Date;
}

@Component({
    selector: 'app-ai-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
    templateUrl: './ai-chat.component.html',
    styleUrls: ['./ai-chat.component.css']
})
export class AiChatComponent implements AfterViewChecked {
    @ViewChild('messagesContainer') messagesContainer!: ElementRef;
    @ViewChild('inputField') inputField!: ElementRef;

    isOpen = false;
    userInput = '';
    isTyping = false;
    messages: ChatMessage[] = [
        {
            sender: 'bot',
            text: 'Bonjour! Je suis votre assistant Caribou Coffee. Comment puis-je vous aider aujourd\'hui?',
            timestamp: new Date()
        }
    ];

    private shouldScrollToBottom = false;

    ngAfterViewChecked() {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
            this.shouldScrollToBottom = false;
        }
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            setTimeout(() => {
                this.inputField?.nativeElement.focus();
            }, 100);
        }
    }

    sendMessage() {
        if (!this.userInput.trim()) return;

        // Add user message
        this.messages.push({
            sender: 'user',
            text: this.userInput,
            timestamp: new Date()
        });

        const userQuestion = this.userInput.toLowerCase();
        this.userInput = '';
        this.shouldScrollToBottom = true;

        // Show typing indicator
        this.isTyping = true;

        // Simulate AI response
        setTimeout(() => {
            this.isTyping = false;
            const response = this.generateResponse(userQuestion);
            this.messages.push({
                sender: 'bot',
                text: response,
                timestamp: new Date()
            });
            this.shouldScrollToBottom = true;
        }, 1500);
    }

    private generateResponse(question: string): string {
        // Simple keyword-based responses
        if (question.includes('audit') || question.includes('inspection')) {
            return 'Pour créer un nouvel audit, cliquez sur "Audits" dans le menu puis sur le bouton "Ajouter". Vous pouvez également consulter l\'historique des audits et leurs détails.';
        } else if (question.includes('utilisateur') || question.includes('user')) {
            return 'La gestion des utilisateurs se trouve dans le menu "Utilisateurs". Vous pouvez ajouter, modifier ou consulter les profils des membres de votre équipe.';
        } else if (question.includes('score') || question.includes('conformité')) {
            return 'Le tableau de bord affiche les scores moyens et les taux de conformité. Un score supérieur à 85% est considéré comme excellent, entre 70% et 85% comme moyen.';
        } else if (question.includes('café') || question.includes('shop')) {
            return 'Vous pouvez voir les performances de chaque café dans le tableau de bord. Les graphiques montrent les scores par établissement et les taux de conformité.';
        } else if (question.includes('aide') || question.includes('help')) {
            return 'Je peux vous aider avec:\n- Création et gestion des audits\n- Gestion des utilisateurs\n- Consultation des statistiques\n- Navigation dans l\'application\n\nQue souhaitez-vous savoir?';
        } else {
            return 'Je suis là pour vous aider! Vous pouvez me poser des questions sur les audits, les utilisateurs, les statistiques ou la navigation dans l\'application.';
        }
    }

    private scrollToBottom() {
        try {
            this.messagesContainer.nativeElement.scrollTop =
                this.messagesContainer.nativeElement.scrollHeight;
        } catch (err) {
            console.error('Scroll error:', err);
        }
    }
}
