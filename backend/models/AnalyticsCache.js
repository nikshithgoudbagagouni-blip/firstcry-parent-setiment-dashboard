const mongoose = require('mongoose');
const db = require('../config/db');

// Original Mongoose Schema & Model
const ConcernSchema = new mongoose.Schema({
  keyword: { type: String, required: true },
  count: { type: Number, default: 1 }
}, { _id: false });

const AnalyticsCacheSchema = new mongoose.Schema({
  classGrade: {
    type: String,
    required: true,
    default: 'school-wide'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  avgSentimentScore: {
    type: Number,
    required: true,
    default: 0
  },
  avgEngagementIndex: {
    type: Number,
    required: true,
    default: 0
  },
  activeAlertsCount: {
    type: Number,
    required: true,
    default: 0
  },
  keyConcerns: [ConcernSchema]
});

const MongoAnalyticsCache = mongoose.model('AnalyticsCache', AnalyticsCacheSchema);

// SQL helper to map row to object format expected by controllers
function mapRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    classGrade: row.class_grade,
    date: row.date,
    avgSentimentScore: Number(row.avg_sentiment_score),
    avgEngagementIndex: row.avg_engagement_index,
    activeAlertsCount: row.active_alerts_count,
    keyConcerns: typeof row.key_concerns === 'string'
      ? JSON.parse(row.key_concerns)
      : (row.key_concerns || []),
    save: async function() {
      const res = await db.query(
        `UPDATE analytics_cache SET class_grade=$1, date=$2, avg_sentiment_score=$3, 
         avg_engagement_index=$4, active_alerts_count=$5, key_concerns=$6 WHERE id=$7 RETURNING *`,
        [
          this.classGrade,
          this.date,
          this.avgSentimentScore,
          this.avgEngagementIndex,
          this.activeAlertsCount,
          JSON.stringify(this.keyConcerns),
          this.id
        ]
      );
      const updated = mapRow(res.rows[0]);
      Object.assign(this, updated);
      return this;
    }
  };
}

// Thenable query chain to mimic Mongoose find().sort().limit()
function createQueryChain(queryParams) {
  return {
    params: queryParams,
    sortObj: null,
    limitVal: null,
    sort: function(sortOpts) {
      this.sortObj = sortOpts;
      return this;
    },
    limit: function(val) {
      this.limitVal = val;
      return this;
    },
    then: async function(resolve, reject) {
      try {
        if (db.getDbType() !== 'postgres') {
          let mq = MongoAnalyticsCache.find(this.params);
          if (this.sortObj) { mq = mq.sort(this.sortObj); }
          if (this.limitVal) { mq = mq.limit(this.limitVal); }
          const res = await mq;
          return resolve(res);
        }

        // Postgres SQL
        let sql = `SELECT * FROM analytics_cache`;
        const values = [];
        if (this.params && this.params.classGrade) {
          sql += ` WHERE class_grade = $1`;
          values.push(this.params.classGrade);
        }

        if (this.sortObj) {
          const sortFields = Object.keys(this.sortObj).map(f => {
            const dir = this.sortObj[f] === 1 ? 'ASC' : 'DESC';
            return `${f === 'date' ? 'date' : f} ${dir}`;
          }).join(', ');
          sql += ` ORDER BY ${sortFields}`;
        } else {
          sql += ` ORDER BY date ASC`;
        }

        if (this.limitVal) {
          sql += ` LIMIT ${Number(this.limitVal)}`;
        }

        const res = await db.query(sql, values);
        resolve(res.rows.map(mapRow));
      } catch (err) {
        reject(err);
      }
    }
  };
}

// Exported Wrapper object
const AnalyticsCacheWrapper = {
  find: function(query) {
    return createQueryChain(query);
  },

  createInstance: function(data) {
    const cache = {
      classGrade: data.classGrade || 'school-wide',
      date: data.date || new Date(),
      avgSentimentScore: data.avgSentimentScore || 0,
      avgEngagementIndex: data.avgEngagementIndex || 0,
      activeAlertsCount: data.activeAlertsCount || 0,
      keyConcerns: data.keyConcerns || [],
      save: async function() {
        const res = await db.query(
          `INSERT INTO analytics_cache (class_grade, date, avg_sentiment_score, avg_engagement_index, active_alerts_count, key_concerns) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING *`,
          [
            this.classGrade,
            this.date,
            this.avgSentimentScore,
            this.avgEngagementIndex,
            this.activeAlertsCount,
            JSON.stringify(this.keyConcerns)
          ]
        );
        const saved = mapRow(res.rows[0]);
        Object.assign(this, saved);
        return this;
      }
    };
    return cache;
  }
};

function AnalyticsCache(data) {
  return AnalyticsCacheWrapper.createInstance(data);
}
Object.assign(AnalyticsCache, AnalyticsCacheWrapper);

module.exports = AnalyticsCache;
