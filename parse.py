import sys
import pandas as pd

def parse_endpoint(f):
	to_serve, nb_cache = [ int(x) for x in f.readline().strip().split(' ') ]
	caches = list()
	for index in range(nb_cache):
		_id, latence = [ int(x) for x in f.readline().strip().split(' ') ]
		caches.append((_id, latence))
	return ({'to_serve': to_serve, 'nb_cache': nb_cache, 'caches': caches})

def parse_req(f):
	info = dict()
	info['video_id'], info['endpoints'], info['nb_req'] = [ int(x) for x in f.readline().strip().split(' ') ]
	return info

def parse(filename):
	meta = dict()
	with open(filename) as f:
		meta['videos'], meta['endpoints'], meta['req_desc'], meta['caches'] , meta['size'] = [ int(x) for x in f.readline().strip().split(' ')]
		videos = [ int(x) for x in f.readline().strip().split(' ') ]
		endpoints = list()
		reqs = list()
		for index in range(meta['endpoints']):
			endpoints.append(parse_endpoint(f))
		for index in range(meta['req_desc']):
			reqs.append(parse_req(f))
	return meta, videos, endpoints, reqs

def ep_by_video(videos, reqs):
	res = list()
	for index, size in enumerate(videos):
		tmp = dict()
		tmp['_id'] = index
		tmp['size'] = size
		tmp['endpoints'] = list(filter(lambda x: x['video_id'] == index, reqs))
		tmp['total_req'] = sum([ x['nb_req'] for x in tmp['endpoints'] ])
		res.append(tmp)
	return res

def caches(endpoints, meta):
	nb_caches = meta['caches']
	caches = [ dict() for i in range(nb_caches + 1) ]
	return caches
	for index, endpoint in enumerate(endpoints):
		for _id, latence in endpoint['caches']:
			caches[_id].append({'index': index, 'latence': latence})
		caches[nb_caches].append((index, endpoint['to_serve']))
	return caches


meta, videos, endpoints, reqs = parse('me_at_the_zoo.in')
tmp = ep_by_video(videos, reqs)
tmp.sort(key = lambda x: x['total_req'], reverse = True)
lst_caches = caches(endpoints, meta)
for video in tmp:
	if meta['size'] > video['size']:
		meta['size'] -= video['size']
		for index in range(len(lst_caches)):
			if not 'videos' in lst_caches[index].keys():
				lst_caches[index]['videos'] = list()
			lst_caches[index]['videos'].append(video['_id'])

print(meta['caches'])
for index in range(meta['caches']):
	print(index, ' '.join(map(str, lst_caches[index]['videos'])))
