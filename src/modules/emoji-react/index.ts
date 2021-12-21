import autobind from 'autobind-decorator';
import { parse } from 'twemoji-parser';
const delay = require('timeout-as-promise');

import { Note } from '@/misskey/note';
import Module from '@/module';
import Stream from '@/stream';
import includes from '@/utils/includes';

export default class extends Module {
	public readonly name = 'emoji-react';

	private htl: ReturnType<Stream['useSharedConnection']>;

	@autobind
	public install() {
		this.htl = this.ai.connection.useSharedConnection('homeTimeline');
		this.htl.on('note', this.onNote);

		return {};
	}

	
	@autobind
	private async onNote(note: Note) {
		if (note.reply != null) return;
		if (note.text == null) return;
		//if (note.text.includes('@')) return; // (自分または他人問わず)メンションっぽかったらreject

		const react = async (reaction: string, immediate = false) => {
			if (!immediate) {
				await delay(1500);
			}
			this.ai.api('notes/reactions/create', {
				noteId: note.id,
				reaction: reaction
			});
		};

		const customEmojis = note.text.match(/:([^\n:]+?):/g);
		if (customEmojis) {
			// カスタム絵文字が複数種類ある場合はキャンセル
			if (!customEmojis.every((val, i, arr) => val === arr[0])) return;

			this.log(`Custom emoji detected - ${customEmojis[0]}`);
			// ここにカスタム絵文字の処理を書く
			if (customEmojis[0] == ':nanmowakaran:') return react(':murishite:');
			if (customEmojis[0] == ':ohayougozaimasu:') return react(':neyoune:');

			// return react(customEmojis[0]);
		}

		const emojis = parse(note.text).map(x => x.text);
		if (emojis.length > 0) {
			// 絵文字が複数種類ある場合はキャンセル
			if (!emojis.every((val, i, arr) => val === arr[0])) return;

			this.log(`Emoji detected - ${emojis[0]}`);

			let reaction = emojis[0];

			switch (reaction) {
				case '✊': return react('🖐', true);
				case '✌': return react('✊', true);
				case '🖐': case '✋': return react('✌', true);
			}

			return react(reaction);
		}

		//ここに単語に対する絵文字処理を書く
		if (includes(note.text, ['掃除', 'そうじ'])) return react(':dame:');
		if (includes(note.text, ['おはよう', '起きた', '起きた', 'おきた', 'おきる'])) return react(':neyoune:');
		if (includes(note.text, ['おやすみ', 'ねる', '寝る', 'ねむたい', 'ねむい'])) return react(':dame:');
		if (includes(note.text, ['逆なでBot', '逆なで', '逆にゃでBot', '逆にゃで'])) return react(':ha_q:');
		if (includes(note.text, ['つらい', 'もうやだ', 'やめたい'])) return react(':murishite:');
		if (includes(note.text, ['ていい?', 'ていい？',])) return react(':dame:');

		if (includes(note.text, ['寿司', 'sushi']) || note.text === 'すし') return react('🍣');
	}


}
